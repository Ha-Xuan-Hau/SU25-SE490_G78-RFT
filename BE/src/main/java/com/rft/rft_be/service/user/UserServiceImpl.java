package com.rft.rft_be.service.user;

import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.user.UserDetailDto;
import com.rft.rft_be.dto.user.UserRegisterDto;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements  UserService{
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    public UserDetailDto register(UserRegisterDto dto){
        if(userRepository.existsByEmail(dto.getEmail())){
            throw new RuntimeException("Email Already Exists");
        }
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setAddress(dto.getAddress());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        return userMapper.userToUserDetailDto(userRepository.save(user));
    }
    @Override
    public UserDTO getProfile(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return userMapper.toDTO(user);
    }

    @Override
    public UserProfileDTO updateProfile(String id, UserProfileDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        userMapper.updateUserFromDTO(dto, user);
        User updated = userRepository.save(user);

        return userMapper.toUserProfileDTO(updated);
    }
}


