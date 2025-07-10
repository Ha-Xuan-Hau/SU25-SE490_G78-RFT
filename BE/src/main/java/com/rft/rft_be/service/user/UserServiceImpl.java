package com.rft.rft_be.service.user;

import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.rft.rft_be.dto.user.*;
import com.rft.rft_be.entity.DriverLicense;
import com.rft.rft_be.entity.UserRegisterVehicle;
import com.rft.rft_be.repository.DriverLicensRepository;
import com.rft.rft_be.repository.UserRegisterVehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.dto.user.UserRegisterDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {

    DriverLicensRepository driverLicensRepository;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    UserRegisterVehicleRepository userRegisterVehicleRepository;

    public UserDetailDTO register(UserRegisterDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
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
        List<String> validLicenseClasses = driverLicensRepository.findValidByUserId(id)
                .stream()
                .map(DriverLicense::getClassField) // Chỉ lấy classField
                .collect(Collectors.toList());
        List<String> registeredVehicles = userRegisterVehicleRepository.findByUserId(id)
                .stream()
                .map(UserRegisterVehicle::getVehicleType) // Lấy vehicleType
                .collect(Collectors.toList());
        UserDTO userDTO = userMapper.toDTO(user);
        userDTO.setValidLicenses(validLicenseClasses);
        userDTO.setRegisteredVehicles(registeredVehicles);

        return userDTO;
    }

    @Override
    public UserProfileDTO updateProfile(String id, UserProfileDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        userMapper.updateUserFromDTO(dto, user);
        User updated = userRepository.save(user);

        return userMapper.toUserProfileDTO(updated);
    }

    @Override
    public String getUserIdFromToken(String token) {
        try {
            // Parse JWT token
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Get the claims from the token
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();

            String userId = claimsSet.getStringClaim("userId");

            return userId;
        } catch (ParseException e) {
            throw new RuntimeException("Invalid token format", e);
        }
    }
    public void registerUserAsProvider(RegisterProviderRequestDTO request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        // cập nhật role
        user.setRole(User.Role.PROVIDER);
        userRepository.save(user);

        // cập nhật openTime, closeTime
        if (request.getOpenTime() != null && request.getCloseTime() != null) {
            // Giả sử openTime/closeTime là chuỗi "HH:mm"
            LocalTime open = LocalTime.parse(request.getOpenTime());
            LocalTime close = LocalTime.parse(request.getCloseTime());
            // Nếu trường trong entity là LocalDateTime, bạn có thể set với ngày hôm nay:
            user.setOpenTime(LocalDateTime.of(LocalDate.now(), open));
            user.setCloseTime(LocalDateTime.of(LocalDate.now(), close));
        }

        userRepository.save(user);

        // lấy các loại xe đã đăng ký trước đó để tránh trùng
        List<String> registeredTypes = userRegisterVehicleRepository
                .findByUserId(user.getId())
                .stream()
                .map(urv -> urv.getVehicleType())
                .collect(Collectors.toList());

        // lọc ra các loại chưa đăng ký để insert
        List<String> typesToInsert = request.getVehicleTypes().stream()
                .filter(type -> !registeredTypes.contains(type))
                .collect(Collectors.toList());

        // Insert các loại chưa trùng
        List<UserRegisterVehicle> entities = typesToInsert.stream()
                .map(type -> UserRegisterVehicle.builder()
                        .user(user)
                        .vehicleType(type)
                        .build())
                .collect(Collectors.toList());

        userRegisterVehicleRepository.saveAll(entities);
    }
}
