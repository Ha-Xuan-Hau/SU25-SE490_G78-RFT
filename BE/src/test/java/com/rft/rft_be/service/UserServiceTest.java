package com.rft.rft_be.service;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.user.RegisterProviderRequestDTO;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.dto.user.UserRegisterDTO;
import com.rft.rft_be.entity.DriverLicense;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserRegisterVehicle;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.repository.DriverLicensRepository;
import com.rft.rft_be.repository.UserRegisterVehicleRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.service.otp.OtpService;
import com.rft.rft_be.service.user.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private DriverLicensRepository driverLicensRepository;
    @Mock
    private UserRegisterVehicleRepository userRegisterVehicleRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private OtpService otpService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(
                driverLicensRepository,
                userRepository,
                passwordEncoder,
                userMapper,
                userRegisterVehicleRepository,
                walletRepository,
                otpService
        );
    }

    @Test
    void testGetProfile_success() {
        // Arrange
        User user = new User(); user.setId("u1");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        DriverLicense license = new DriverLicense(); license.setClassField("B");
        when(driverLicensRepository.findValidByUserId("u1")).thenReturn(List.of(license));

        UserRegisterVehicle vehicle = new UserRegisterVehicle(); vehicle.setVehicleType("Car");
        when(userRegisterVehicleRepository.findByUserId("u1")).thenReturn(List.of(vehicle));

        UserDTO dto = new UserDTO(); dto.setId("u1");
        when(userMapper.toDTO(user)).thenReturn(dto);

        // Act
        UserDTO result = userService.getProfile("u1");

        // Assert
        assertEquals("u1", result.getId());
        assertEquals(List.of("B"), result.getValidLicenses());
        assertEquals(List.of("Car"), result.getRegisteredVehicles());
    }

    @Test
    void testUpdateProfile_success() {
        User user = new User();
        user.setId("u1");
        UserProfileDTO dto = new UserProfileDTO();
        User updatedUser = new User();
        updatedUser.setId("u1");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(updatedUser);

        UserProfileDTO resultDto = new UserProfileDTO();
        when(userMapper.toUserProfileDTO(updatedUser)).thenReturn(resultDto);

        UserProfileDTO result = userService.updateProfile("u1", dto);
        assertSame(resultDto, result);
    }

    @Test
    void testGetUserIdFromToken_success() throws Exception {
        String token = generateMockJwt("u1");
        String userId = userService.getUserIdFromToken(token);
        assertEquals("u1", userId);
    }

    @Test
    void testRegisterUserAsProvider_success() {
        String userId = "u1";
        RegisterProviderRequestDTO dto = new RegisterProviderRequestDTO();
        dto.setUserId(userId);
        dto.setOpenTime("08:00");
        dto.setCloseTime("20:00");
        dto.setVehicleTypes(List.of("Car", "Motorbike"));

        User user = new User();
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRegisterVehicleRepository.findByUserId(userId)).thenReturn(List.of());

        userService.registerUserAsProvider(dto);

        verify(userRepository, times(2)).save(any(User.class));
        verify(userRegisterVehicleRepository).saveAll(anyList());
    }

    // Helper method để tạo JWT test
    private String generateMockJwt(String userId) throws Exception {
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .claim("userId", userId)
                .build();
        SignedJWT signedJWT = new SignedJWT(
                new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256),
                claimsSet
        );
        signedJWT.sign(new com.nimbusds.jose.crypto.MACSigner("12345678901234567890123456789012"));
        return signedJWT.serialize();
    }

    @Test
    void testRegister_success() {
        // Arrange
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setEmail("test@example.com");
        dto.setPhone("0123456789");
        dto.setPassword("password");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

        User savedUser = new User();
        savedUser.setEmail(dto.getEmail());
        savedUser.setPhone(dto.getPhone());
        savedUser.setPassword("hashed-password");

        when(passwordEncoder.encode("password")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserDetailDTO expectedDto = new UserDetailDTO();
        expectedDto.setEmail("test@example.com");
        when(userMapper.userToUserDetailDto(savedUser)).thenReturn(expectedDto);

        // Act
        UserDetailDTO result = userService.register(dto);

        // Assert
        assertEquals("test@example.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRegister_emailExists_throwsException() {
        // Arrange
        UserRegisterDTO dto = new UserRegisterDTO();
        dto.setEmail("test@example.com");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act + Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.register(dto);
        });

        assertEquals("Email Already Exists", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testGetUserIdFromToken_invalidFormat_throwsException() {
        String invalidToken = "this-is-not-a-valid-jwt-token";

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            userService.getUserIdFromToken(invalidToken);
        });

        assertEquals("Invalid token format", ex.getMessage());
    }
    @Test
    void testRegisterUserAsProvider_withOpenAndCloseTime_setsTimesCorrectly() {
        // Arrange
        String userId = "u1";
        RegisterProviderRequestDTO dto = new RegisterProviderRequestDTO();
        dto.setUserId(userId);
        dto.setOpenTime("08:00");
        dto.setCloseTime("20:00");
        dto.setVehicleTypes(List.of("Car"));

        User user = new User();
        user.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRegisterVehicleRepository.findByUserId(userId)).thenReturn(List.of());

        // Act
        userService.registerUserAsProvider(dto);

        // Assert
        verify(userRepository, times(2)).save(user);
        verify(userRegisterVehicleRepository).saveAll(anyList());

        // Kiểm tra thời gian được set đúng
        assertEquals(LocalTime.of(8, 0), user.getOpenTime().toLocalTime());
        assertEquals(LocalTime.of(20, 0), user.getCloseTime().toLocalTime());
    }

    @Test
    void testRegisterUserAsProvider_withOpenAndCloseTime_setsTimesCorrectly1() {
        // Arrange
        String userId = "u1";
        RegisterProviderRequestDTO dto = new RegisterProviderRequestDTO();
        dto.setUserId(userId);
        dto.setOpenTime("08:00");
        dto.setCloseTime("20:00");
        dto.setVehicleTypes(List.of("Car"));

        User user = new User();
        user.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRegisterVehicleRepository.findByUserId(userId)).thenReturn(List.of());

        // Act
        userService.registerUserAsProvider(dto);

        // Assert
        verify(userRepository, times(2)).save(user);
        verify(userRegisterVehicleRepository).saveAll(anyList());

        // Kiểm tra thời gian được set đúng
        assertEquals(LocalTime.of(8, 0), user.getOpenTime().toLocalTime());
        assertEquals(LocalTime.of(20, 0), user.getCloseTime().toLocalTime());
    }

    @Test
    void testRegisterUserAsProvider_success1() {
        RegisterProviderRequestDTO dto = new RegisterProviderRequestDTO();
        dto.setUserId("u1");
        dto.setOpenTime("08:00");
        dto.setCloseTime("18:00");
        dto.setVehicleTypes(List.of("Car", "Bike"));

        User user = new User(); user.setId("u1");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRegisterVehicleRepository.findByUserId("u1")).thenReturn(List.of());

        userService.registerUserAsProvider(dto);

        verify(userRepository, times(2)).save(any(User.class));
        verify(userRegisterVehicleRepository).saveAll(anyList());

        assertNotNull(user.getOpenTime());
        assertNotNull(user.getCloseTime());
    }

    @Test
    void testRegisterUserAsProvider_withoutOpenOrCloseTime_skipTimeSetting() {
        RegisterProviderRequestDTO dto = new RegisterProviderRequestDTO();
        dto.setUserId("u1");
        dto.setOpenTime(null);  // 1 trong 2 là null
        dto.setCloseTime("18:00");
        dto.setVehicleTypes(List.of("Car"));

        User user = new User(); user.setId("u1");

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRegisterVehicleRepository.findByUserId("u1")).thenReturn(List.of());

        userService.registerUserAsProvider(dto);

        verify(userRepository, times(2)).save(user);
        verify(userRegisterVehicleRepository).saveAll(anyList());

        assertNull(user.getOpenTime());  // chưa set
        assertNull(user.getCloseTime()); // chưa set vì if bị skip
    }
}
