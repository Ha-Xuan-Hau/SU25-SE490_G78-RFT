package com.rft.rft_be.service;

import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserMapper userMapper;

    @Override
    public UserDTO getProfile(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return userMapper.toUserDTO(user);
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