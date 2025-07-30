package com.rft.rft_be.service;

import com.rft.rft_be.dto.driverLicense.CreateDriverLicenseDTO;
import com.rft.rft_be.dto.driverLicense.DriverLicenseDTO;
import com.rft.rft_be.entity.DriverLicense;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.DriverLicenseMapper;
import com.rft.rft_be.repository.DriverLicensRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.DriverLicense.DriverLicenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriverLicenseServiceTest {

    @Mock
    private DriverLicensRepository driverLicenseRepository;

    @Mock
    private DriverLicenseMapper driverLicenseMapper;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DriverLicenseServiceImpl driverLicenseService;

    private User testUser;
    private DriverLicense testDriverLicense;
    private DriverLicenseDTO testDriverLicenseDTO;
    private CreateDriverLicenseDTO testCreateDriverLicenseDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-001")
                .fullName("John Doe")
                .email("john@example.com")
                .build();

        testDriverLicense = DriverLicense.builder()
                .id("license-001")
                .user(testUser)
                .licenseNumber("B2-123456")
                .classField("B2")
                .status(DriverLicense.Status.VALID)
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testDriverLicenseDTO = DriverLicenseDTO.builder()
                .id("license-001")
                .userId("user-001")
                .userName("John Doe")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("VALID")
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testCreateDriverLicenseDTO = CreateDriverLicenseDTO.builder()
                .userId("user-001")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("VALID")
                .image("image-url")
                .build();
    }

    // Test getAllDriverLicenses method
    @Test
    void getAllDriverLicenses_Success() {
        // Arrange
        List<DriverLicense> driverLicenses = Arrays.asList(testDriverLicense);
        when(driverLicenseRepository.findAll()).thenReturn(driverLicenses);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getAllDriverLicenses();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testDriverLicenseDTO);
        verify(driverLicenseRepository, times(1)).findAll();
        verify(driverLicenseMapper, times(1)).toDTO(testDriverLicense);
    }

    @Test
    void getAllDriverLicenses_EmptyList() {
        // Arrange
        when(driverLicenseRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getAllDriverLicenses();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
        verify(driverLicenseRepository, times(1)).findAll();
        verify(driverLicenseMapper, never()).toDTO(any());
    }

    // Test getDriverLicenseById method
    @Test
    void getDriverLicenseById_Success() {
        // Arrange
        when(driverLicenseRepository.findById("license-001")).thenReturn(Optional.of(testDriverLicense));
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.getDriverLicenseById("license-001");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testDriverLicenseDTO);
        verify(driverLicenseRepository, times(1)).findById("license-001");
        verify(driverLicenseMapper, times(1)).toDTO(testDriverLicense);
    }

    @Test
    void getDriverLicenseById_NotFound() {
        // Arrange
        when(driverLicenseRepository.findById("non-existent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.getDriverLicenseById("non-existent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Driver license not found with id: non-existent");
        verify(driverLicenseRepository, times(1)).findById("non-existent");
        verify(driverLicenseMapper, never()).toDTO(any());
    }

    // Test getDriverLicensesByUserId method
    @Test
    void getDriverLicensesByUserId_Success() {
        // Arrange
        List<DriverLicense> driverLicenses = Arrays.asList(testDriverLicense);
        when(driverLicenseRepository.findByUserId("user-001")).thenReturn(driverLicenses);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getDriverLicensesByUserId("user-001");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testDriverLicenseDTO);
        verify(driverLicenseRepository, times(1)).findByUserId("user-001");
        verify(driverLicenseMapper, times(1)).toDTO(testDriverLicense);
    }

    @Test
    void getDriverLicensesByUserId_EmptyList() {
        // Arrange
        when(driverLicenseRepository.findByUserId("user-001")).thenReturn(Arrays.asList());

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getDriverLicensesByUserId("user-001");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEmpty();
        verify(driverLicenseRepository, times(1)).findByUserId("user-001");
        verify(driverLicenseMapper, never()).toDTO(any());
    }

    // Test getDriverLicensesByStatus method
    @Test
    void getDriverLicensesByStatus_ValidStatus_Success() {
        // Arrange
        List<DriverLicense> driverLicenses = Arrays.asList(testDriverLicense);
        when(driverLicenseRepository.findByStatus(DriverLicense.Status.VALID)).thenReturn(driverLicenses);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getDriverLicensesByStatus("VALID");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testDriverLicenseDTO);
        verify(driverLicenseRepository, times(1)).findByStatus(DriverLicense.Status.VALID);
        verify(driverLicenseMapper, times(1)).toDTO(testDriverLicense);
    }

    @Test
    void getDriverLicensesByStatus_ExpiredStatus_Success() {
        // Arrange
        DriverLicense expiredLicense = DriverLicense.builder()
                .id("license-001")
                .user(testUser)
                .licenseNumber("B2-123456")
                .classField("B2")
                .status(DriverLicense.Status.EXPIRED)
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        DriverLicenseDTO expiredLicenseDTO = DriverLicenseDTO.builder()
                .id("license-001")
                .userId("user-001")
                .userName("John Doe")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("EXPIRED")
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        List<DriverLicense> driverLicenses = Arrays.asList(expiredLicense);
        when(driverLicenseRepository.findByStatus(DriverLicense.Status.EXPIRED)).thenReturn(driverLicenses);
        when(driverLicenseMapper.toDTO(expiredLicense)).thenReturn(expiredLicenseDTO);

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getDriverLicensesByStatus("EXPIRED");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(expiredLicenseDTO);
        verify(driverLicenseRepository, times(1)).findByStatus(DriverLicense.Status.EXPIRED);
        verify(driverLicenseMapper, times(1)).toDTO(expiredLicense);
    }

    @Test
    void getDriverLicensesByStatus_InvalidStatus_ThrowsException() {
        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.getDriverLicensesByStatus("INVALID"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid status: INVALID. Valid values are: VALID, EXPIRED");
        verify(driverLicenseRepository, never()).findByStatus(any());
        verify(driverLicenseMapper, never()).toDTO(any());
    }

    @Test
    void getDriverLicensesByStatus_LowercaseStatus_Success() {
        // Arrange
        List<DriverLicense> driverLicenses = Arrays.asList(testDriverLicense);
        when(driverLicenseRepository.findByStatus(DriverLicense.Status.VALID)).thenReturn(driverLicenses);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        List<DriverLicenseDTO> result = driverLicenseService.getDriverLicensesByStatus("valid");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        verify(driverLicenseRepository, times(1)).findByStatus(DriverLicense.Status.VALID);
    }

    // Test getDriverLicenseByLicenseNumber method
    @Test
    void getDriverLicenseByLicenseNumber_Success() {
        // Arrange
        when(driverLicenseRepository.findByLicenseNumber("B2-123456")).thenReturn(Optional.of(testDriverLicense));
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.getDriverLicenseByLicenseNumber("B2-123456");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testDriverLicenseDTO);
        verify(driverLicenseRepository, times(1)).findByLicenseNumber("B2-123456");
        verify(driverLicenseMapper, times(1)).toDTO(testDriverLicense);
    }

    @Test
    void getDriverLicenseByLicenseNumber_NotFound() {
        // Arrange
        when(driverLicenseRepository.findByLicenseNumber("non-existent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.getDriverLicenseByLicenseNumber("non-existent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Driver license not found with license number: non-existent");
        verify(driverLicenseRepository, times(1)).findByLicenseNumber("non-existent");
        verify(driverLicenseMapper, never()).toDTO(any());
    }

    // Test createDriverLicense method
    @Test
    void createDriverLicense_Success() {
        // Arrange
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(driverLicenseRepository.existsByLicenseNumber("B2-123456")).thenReturn(false);
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenReturn(testDriverLicense);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.createDriverLicense(testCreateDriverLicenseDTO);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testDriverLicenseDTO);
        verify(userRepository, times(1)).findById("user-001");
        verify(driverLicenseRepository, times(1)).existsByLicenseNumber("B2-123456");
        verify(driverLicenseRepository, times(1)).save(any(DriverLicense.class));
        verify(driverLicenseMapper, times(1)).toDTO(testDriverLicense);
    }

    @Test
    void createDriverLicense_WithNullStatus_SetsDefaultValidStatus() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId("user-001")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status(null)
                .image("image-url")
                .build();
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(driverLicenseRepository.existsByLicenseNumber("B2-123456")).thenReturn(false);
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenReturn(testDriverLicense);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.createDriverLicense(createDTO);

        // Assert
        assertThat(result).isNotNull();
        verify(driverLicenseRepository, times(1)).save(argThat(license -> 
            license.getStatus() == DriverLicense.Status.VALID));
    }

    @Test
    void createDriverLicense_WithEmptyStatus_SetsDefaultValidStatus() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId("user-001")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("")
                .image("image-url")
                .build();
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(driverLicenseRepository.existsByLicenseNumber("B2-123456")).thenReturn(false);
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenReturn(testDriverLicense);
        when(driverLicenseMapper.toDTO(testDriverLicense)).thenReturn(testDriverLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.createDriverLicense(createDTO);

        // Assert
        assertThat(result).isNotNull();
        verify(driverLicenseRepository, times(1)).save(argThat(license -> 
            license.getStatus() == DriverLicense.Status.VALID));
    }

    @Test
    void createDriverLicense_NullUserId_ThrowsException() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId(null)
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("VALID")
                .image("image-url")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User ID is required");
        verify(userRepository, never()).findById(any());
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void createDriverLicense_EmptyUserId_ThrowsException() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId("")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("VALID")
                .image("image-url")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User ID is required");
        verify(userRepository, never()).findById(any());
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void createDriverLicense_NullLicenseNumber_ThrowsException() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId("user-001")
                .licenseNumber(null)
                .classField("B2")
                .status("VALID")
                .image("image-url")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("License number is required");
        verify(userRepository, never()).findById(any());
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void createDriverLicense_EmptyLicenseNumber_ThrowsException() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId("user-001")
                .licenseNumber("")
                .classField("B2")
                .status("VALID")
                .image("image-url")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("License number is required");
        verify(userRepository, never()).findById(any());
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void createDriverLicense_DuplicateLicenseNumber_ThrowsException() {
        // Arrange
        when(driverLicenseRepository.existsByLicenseNumber("B2-123456")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(testCreateDriverLicenseDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Driver license with number B2-123456 already exists");
        verify(driverLicenseRepository, times(1)).existsByLicenseNumber("B2-123456");
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void createDriverLicense_UserNotFound_ThrowsException() {
        // Arrange
        when(driverLicenseRepository.existsByLicenseNumber("B2-123456")).thenReturn(false);
        when(userRepository.findById("user-001")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(testCreateDriverLicenseDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User not found with id: user-001");
        verify(userRepository, times(1)).findById("user-001");
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void createDriverLicense_InvalidStatus_ThrowsException() {
        // Arrange
        CreateDriverLicenseDTO createDTO = CreateDriverLicenseDTO.builder()
                .userId("user-001")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("INVALID_STATUS")
                .image("image-url")
                .build();

        // Mock user repository to return a user so we can test status validation
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(driverLicenseRepository.existsByLicenseNumber("B2-123456")).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.createDriverLicense(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid status: INVALID_STATUS. Valid values are: VALID, EXPIRED");
        verify(userRepository, times(1)).findById("user-001");
        verify(driverLicenseRepository, times(1)).existsByLicenseNumber("B2-123456");
        verify(driverLicenseRepository, never()).save(any());
    }

    // Test updateDriverLicense method
    @Test
    void updateDriverLicense_Success() {
        // Arrange
        DriverLicenseDTO updateDTO = DriverLicenseDTO.builder()
                .licenseNumber("B2-654321")
                .classField("B1")
                .status("EXPIRED")
                .image("new-image-url")
                .build();
        
        DriverLicense updatedLicense = DriverLicense.builder()
                .id("license-001")
                .user(testUser)
                .licenseNumber("B2-654321")
                .classField("B1")
                .status(DriverLicense.Status.EXPIRED)
                .image("new-image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        DriverLicenseDTO updatedLicenseDTO = DriverLicenseDTO.builder()
                .id("license-001")
                .userId("user-001")
                .userName("John Doe")
                .licenseNumber("B2-654321")
                .classField("B1")
                .status("EXPIRED")
                .image("new-image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(driverLicenseRepository.findById("license-001")).thenReturn(Optional.of(testDriverLicense));
        when(driverLicenseRepository.existsByLicenseNumber("B2-654321")).thenReturn(false);
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenReturn(updatedLicense);
        when(driverLicenseMapper.toDTO(updatedLicense)).thenReturn(updatedLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.updateDriverLicense("license-001", updateDTO);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(updatedLicenseDTO);
        verify(driverLicenseRepository, times(1)).findById("license-001");
        verify(driverLicenseRepository, times(1)).existsByLicenseNumber("B2-654321");
        verify(driverLicenseRepository, times(1)).save(any(DriverLicense.class));
        verify(driverLicenseMapper, times(1)).toDTO(updatedLicense);
    }

    @Test
    void updateDriverLicense_NotFound_ThrowsException() {
        // Arrange
        DriverLicenseDTO updateDTO = DriverLicenseDTO.builder()
                .licenseNumber("B2-654321")
                .build();
        when(driverLicenseRepository.findById("non-existent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.updateDriverLicense("non-existent", updateDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Driver license not found with id: non-existent");
        verify(driverLicenseRepository, times(1)).findById("non-existent");
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void updateDriverLicense_DuplicateLicenseNumber_ThrowsException() {
        // Arrange
        DriverLicenseDTO updateDTO = DriverLicenseDTO.builder()
                .licenseNumber("B2-654321")
                .build();
        when(driverLicenseRepository.findById("license-001")).thenReturn(Optional.of(testDriverLicense));
        when(driverLicenseRepository.existsByLicenseNumber("B2-654321")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.updateDriverLicense("license-001", updateDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Driver license with number B2-654321 already exists");
        verify(driverLicenseRepository, times(1)).findById("license-001");
        verify(driverLicenseRepository, times(1)).existsByLicenseNumber("B2-654321");
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void updateDriverLicense_SameLicenseNumber_DoesNotCheckDuplicate() {
        // Arrange
        DriverLicenseDTO updateDTO = DriverLicenseDTO.builder()
                .licenseNumber("B2-123456") // Same as existing
                .classField("B1")
                .build();
        
        DriverLicense updatedLicense = DriverLicense.builder()
                .id("license-001")
                .user(testUser)
                .licenseNumber("B2-123456")
                .classField("B1")
                .status(DriverLicense.Status.VALID)
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        DriverLicenseDTO updatedLicenseDTO = DriverLicenseDTO.builder()
                .id("license-001")
                .userId("user-001")
                .userName("John Doe")
                .licenseNumber("B2-123456")
                .classField("B1")
                .status("VALID")
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(driverLicenseRepository.findById("license-001")).thenReturn(Optional.of(testDriverLicense));
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenReturn(updatedLicense);
        when(driverLicenseMapper.toDTO(updatedLicense)).thenReturn(updatedLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.updateDriverLicense("license-001", updateDTO);

        // Assert
        assertThat(result).isNotNull();
        verify(driverLicenseRepository, times(1)).findById("license-001");
        verify(driverLicenseRepository, never()).existsByLicenseNumber(any());
        verify(driverLicenseRepository, times(1)).save(any(DriverLicense.class));
    }

    @Test
    void updateDriverLicense_InvalidStatus_ThrowsException() {
        // Arrange
        DriverLicenseDTO updateDTO = DriverLicenseDTO.builder()
                .status("INVALID_STATUS")
                .build();
        when(driverLicenseRepository.findById("license-001")).thenReturn(Optional.of(testDriverLicense));

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.updateDriverLicense("license-001", updateDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid status: INVALID_STATUS. Valid values are: VALID, EXPIRED");
        verify(driverLicenseRepository, times(1)).findById("license-001");
        verify(driverLicenseRepository, never()).save(any());
    }

    @Test
    void updateDriverLicense_PartialUpdate_Success() {
        // Arrange
        DriverLicenseDTO updateDTO = DriverLicenseDTO.builder()
                .classField("B1")
                .build(); // Only update classField
        
        DriverLicense updatedLicense = DriverLicense.builder()
                .id("license-001")
                .user(testUser)
                .licenseNumber("B2-123456")
                .classField("B1")
                .status(DriverLicense.Status.VALID)
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        DriverLicenseDTO updatedLicenseDTO = DriverLicenseDTO.builder()
                .id("license-001")
                .userId("user-001")
                .userName("John Doe")
                .licenseNumber("B2-123456")
                .classField("B1")
                .status("VALID")
                .image("image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(driverLicenseRepository.findById("license-001")).thenReturn(Optional.of(testDriverLicense));
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenReturn(updatedLicense);
        when(driverLicenseMapper.toDTO(updatedLicense)).thenReturn(updatedLicenseDTO);

        // Act
        DriverLicenseDTO result = driverLicenseService.updateDriverLicense("license-001", updateDTO);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getClassField()).isEqualTo("B1");
        assertThat(result.getLicenseNumber()).isEqualTo("B2-123456"); // Should remain unchanged
        verify(driverLicenseRepository, times(1)).save(any(DriverLicense.class));
    }

    // Test deleteDriverLicense method
    @Test
    void deleteDriverLicense_Success() {
        // Arrange
        when(driverLicenseRepository.existsById("license-001")).thenReturn(true);
        doNothing().when(driverLicenseRepository).deleteById("license-001");

        // Act
        driverLicenseService.deleteDriverLicense("license-001");

        // Assert
        verify(driverLicenseRepository, times(1)).existsById("license-001");
        verify(driverLicenseRepository, times(1)).deleteById("license-001");
    }

    @Test
    void deleteDriverLicense_NotFound_ThrowsException() {
        // Arrange
        when(driverLicenseRepository.existsById("non-existent")).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> driverLicenseService.deleteDriverLicense("non-existent"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Driver license not found with id: non-existent");
        verify(driverLicenseRepository, times(1)).existsById("non-existent");
        verify(driverLicenseRepository, never()).deleteById(any());
    }
}
