package com.rft.rft_be.service;

import com.rft.rft_be.dto.penalty.CreatePenaltyDTO;
import com.rft.rft_be.dto.penalty.PenaltyDTO;
import com.rft.rft_be.entity.Penalty;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.PenaltyMapper;
import com.rft.rft_be.repository.PenaltyRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.penalty.PenaltyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PenaltyServiceTest {

    @Mock
    private PenaltyRepository penaltyRepository;

    @Mock
    private PenaltyMapper penaltyMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private PenaltyServiceImpl penaltyService;

    private User testUser;
    private Penalty testPenalty;
    private PenaltyDTO testPenaltyDTO;
    private CreatePenaltyDTO testCreatePenaltyDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user123")
                .fullName("Test User")
                .build();

        testPenalty = Penalty.builder()
                .id("penalty123")
                .user(testUser)
                .penaltyType(Penalty.PenaltyType.PERCENT)
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        testPenaltyDTO = PenaltyDTO.builder()
                .id("penalty123")
                .userId("user123")
                .userName("Test User")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        testCreatePenaltyDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();
    }

    // Test getPenaltiesByUserId
    @Test
    void getPenaltiesByUserId_Success() {
        // Given
        String userId = "user123";
        List<Penalty> penalties = Arrays.asList(testPenalty);
        
        when(userRepository.existsById(userId)).thenReturn(true);
        when(penaltyRepository.findByUserId(userId)).thenReturn(penalties);
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        List<PenaltyDTO> result = penaltyService.getPenaltiesByUserId(userId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testPenaltyDTO);
        verify(userRepository).existsById(userId);
        verify(penaltyRepository).findByUserId(userId);
        verify(penaltyMapper).toDTO(testPenalty);
    }

    @Test
    void getPenaltiesByUserId_UserNotFound_ThrowsException() {
        // Given
        String userId = "nonexistent";
        when(userRepository.existsById(userId)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> penaltyService.getPenaltiesByUserId(userId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getPenaltiesByUserId_RepositoryException_ThrowsException() {
        // Given
        String userId = "user123";
        when(userRepository.existsById(userId)).thenReturn(true);
        when(penaltyRepository.findByUserId(userId)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        assertThatThrownBy(() -> penaltyService.getPenaltiesByUserId(userId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to get penalties by user");
    }

    // Test createPenalty
    @Test
    void createPenalty_Success() {
        // Given
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(penaltyRepository.save(any(Penalty.class))).thenReturn(testPenalty);
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        PenaltyDTO result = penaltyService.createPenalty(testCreatePenaltyDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testPenaltyDTO);
        verify(userRepository).findById("user123");
        verify(penaltyRepository).save(any(Penalty.class));
        verify(penaltyMapper).toDTO(testPenalty);
    }

    @Test
    void createPenalty_InvalidPenaltyType_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("INVALID")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid penalty type");
    }

//    @Test
//    void createPenalty_PercentTypeExceeds100_ThrowsException() {
//        // Given
//        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
//                .userId("user123")
//                .penaltyType("PERCENT")
//                .penaltyValue(BigDecimal.valueOf(150))
//                .minCancelHour(24)
//                .description("Test penalty")
//                .build();
//
//        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
//
//        // When & Then
//        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
//                .isInstanceOf(RuntimeException.class)
//                .hasMessageContaining("Penalty value for PERCENT type cannot exceed 100");
//    }

    @Test
    void createPenalty_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findById("user123")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(testCreatePenaltyDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createPenalty_NullUserId_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId(null)
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User ID is required");
    }

    @Test
    void createPenalty_NegativePenaltyValue_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(-10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty value must be greater than or equal to 0");
    }

    // Test updatePenalty
    @Test
    void updatePenalty_Success() {
        // Given
        String penaltyId = "penalty123";
        PenaltyDTO updateDTO = PenaltyDTO.builder()
                .penaltyType("FIXED")
                .penaltyValue(BigDecimal.valueOf(50000))
                .minCancelHour(48)
                .description("Updated penalty")
                .build();

        Penalty updatedPenalty = Penalty.builder()
                .id(penaltyId)
                .user(testUser)
                .penaltyType(Penalty.PenaltyType.FIXED)
                .penaltyValue(BigDecimal.valueOf(50000))
                .minCancelHour(48)
                .description("Updated penalty")
                .build();

        PenaltyDTO expectedDTO = PenaltyDTO.builder()
                .id(penaltyId)
                .userId("user123")
                .userName("Test User")
                .penaltyType("FIXED")
                .penaltyValue(BigDecimal.valueOf(50000))
                .minCancelHour(48)
                .description("Updated penalty")
                .build();

        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));
        when(penaltyRepository.save(any(Penalty.class))).thenReturn(updatedPenalty);
        when(penaltyMapper.toDTO(updatedPenalty)).thenReturn(expectedDTO);

        // When
        PenaltyDTO result = penaltyService.updatePenalty(penaltyId, updateDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(expectedDTO);
        verify(penaltyRepository).findById(penaltyId);
        verify(penaltyRepository).save(any(Penalty.class));
        verify(penaltyMapper).toDTO(updatedPenalty);
    }

    @Test
    void updatePenalty_PenaltyNotFound_ThrowsException() {
        // Given
        String penaltyId = "nonexistent";
        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> penaltyService.updatePenalty(penaltyId, testPenaltyDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty not found");
    }

    @Test
    void updatePenalty_InvalidPenaltyType_ThrowsException() {
        // Given
        String penaltyId = "penalty123";
        PenaltyDTO invalidDTO = PenaltyDTO.builder()
                .penaltyType("INVALID")
                .build();

        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));

        // When & Then
        assertThatThrownBy(() -> penaltyService.updatePenalty(penaltyId, invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid penalty type");
    }

    @Test
    void updatePenalty_PercentTypeExceeds100_ThrowsException() {
        // Given
        String penaltyId = "penalty123";
        PenaltyDTO invalidDTO = PenaltyDTO.builder()
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(150))
                .build();

        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));

        // When & Then
        assertThatThrownBy(() -> penaltyService.updatePenalty(penaltyId, invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty value for PERCENT type cannot exceed 100");
    }

    @Test
    void updatePenalty_NegativePenaltyValue_ThrowsException() {
        // Given
        String penaltyId = "penalty123";
        PenaltyDTO invalidDTO = PenaltyDTO.builder()
                .penaltyValue(BigDecimal.valueOf(-10))
                .build();

        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));

        // When & Then
        assertThatThrownBy(() -> penaltyService.updatePenalty(penaltyId, invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty value must be greater than or equal to 0");
    }

    @Test
    void updatePenalty_NegativeMinCancelHour_ThrowsException() {
        // Given
        String penaltyId = "penalty123";
        PenaltyDTO invalidDTO = PenaltyDTO.builder()
                .minCancelHour(-10)
                .build();

        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));

        // When & Then
        assertThatThrownBy(() -> penaltyService.updatePenalty(penaltyId, invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Min cancel hour must be greater than or equal to 0");
    }

    @Test
    void updatePenalty_UpdateUserId_Success() {
        // Given
        String penaltyId = "penalty123";
        User newUser = User.builder().id("user456").fullName("New User").build();
        PenaltyDTO updateDTO = PenaltyDTO.builder()
                .userId("user456")
                .build();

        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));
        when(userRepository.findById("user456")).thenReturn(Optional.of(newUser));
        when(penaltyRepository.save(any(Penalty.class))).thenReturn(testPenalty);
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        PenaltyDTO result = penaltyService.updatePenalty(penaltyId, updateDTO);

        // Then
        assertThat(result).isNotNull();
        verify(userRepository).findById("user456");
    }

    // Test deletePenalty
    @Test
    void deletePenalty_Success() {
        // Given
        String penaltyId = "penalty123";
        when(penaltyRepository.existsById(penaltyId)).thenReturn(true);
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenReturn(0L);

        // When
        penaltyService.deletePenalty(penaltyId);

        // Then
        verify(penaltyRepository).existsById(penaltyId);
        verify(vehicleRepository).countByPenaltyId(penaltyId);
        verify(penaltyRepository).deleteById(penaltyId);
    }

    @Test
    void deletePenalty_PenaltyNotFound_ThrowsException() {
        // Given
        String penaltyId = "nonexistent";
        when(penaltyRepository.existsById(penaltyId)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> penaltyService.deletePenalty(penaltyId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty not found");
    }

    @Test
    void deletePenalty_PenaltyInUse_ThrowsException() {
        // Given
        String penaltyId = "penalty123";
        when(penaltyRepository.existsById(penaltyId)).thenReturn(true);
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenReturn(5L);

        // When & Then
        assertThatThrownBy(() -> penaltyService.deletePenalty(penaltyId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot delete penalty that is being used");
    }

    // Test getPenaltyById
    @Test
    void getPenaltyById_Success() {
        // Given
        String penaltyId = "penalty123";
        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.of(testPenalty));
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        PenaltyDTO result = penaltyService.getPenaltyById(penaltyId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(testPenaltyDTO);
        verify(penaltyRepository).findById(penaltyId);
        verify(penaltyMapper).toDTO(testPenalty);
    }

    @Test
    void getPenaltyById_PenaltyNotFound_ThrowsException() {
        // Given
        String penaltyId = "nonexistent";
        when(penaltyRepository.findById(penaltyId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> penaltyService.getPenaltyById(penaltyId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty not found");
    }

    // Test getAllPenalties
    @Test
    void getAllPenalties_Success() {
        // Given
        List<Penalty> penalties = Arrays.asList(testPenalty);
        List<PenaltyDTO> expectedDTOs = Arrays.asList(testPenaltyDTO);

        when(penaltyRepository.findAll()).thenReturn(penalties);
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        List<PenaltyDTO> result = penaltyService.getAllPenalties();

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result).isEqualTo(expectedDTOs);
        verify(penaltyRepository).findAll();
        verify(penaltyMapper).toDTO(testPenalty);
    }

    @Test
    void getAllPenalties_RepositoryException_ThrowsException() {
        // Given
        when(penaltyRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // When & Then
        assertThatThrownBy(() -> penaltyService.getAllPenalties())
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to get all penalties");
    }

    // Test getPenaltiesByType
    @Test
    void getPenaltiesByType_Success() {
        // Given
        String penaltyType = "PERCENT";
        List<Penalty> penalties = Arrays.asList(testPenalty);
        List<PenaltyDTO> expectedDTOs = Arrays.asList(testPenaltyDTO);

        when(penaltyRepository.findByPenaltyType(Penalty.PenaltyType.PERCENT)).thenReturn(penalties);
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        List<PenaltyDTO> result = penaltyService.getPenaltiesByType(penaltyType);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result).isEqualTo(expectedDTOs);
        verify(penaltyRepository).findByPenaltyType(Penalty.PenaltyType.PERCENT);
        verify(penaltyMapper).toDTO(testPenalty);
    }

    @Test
    void getPenaltiesByType_InvalidType_ThrowsException() {
        // Given
        String invalidType = "INVALID";

        // When & Then
        assertThatThrownBy(() -> penaltyService.getPenaltiesByType(invalidType))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid penalty type");
    }

    // Test getPenaltiesByMinCancelHour
    @Test
    void getPenaltiesByMinCancelHour_Success() {
        // Given
        Integer minHours = 24;
        List<Penalty> penalties = Arrays.asList(testPenalty);
        List<PenaltyDTO> expectedDTOs = Arrays.asList(testPenaltyDTO);

        when(penaltyRepository.findByMinCancelHourLessThanEqual(minHours)).thenReturn(penalties);
        when(penaltyMapper.toDTO(testPenalty)).thenReturn(testPenaltyDTO);

        // When
        List<PenaltyDTO> result = penaltyService.getPenaltiesByMinCancelHour(minHours);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result).isEqualTo(expectedDTOs);
        verify(penaltyRepository).findByMinCancelHourLessThanEqual(minHours);
        verify(penaltyMapper).toDTO(testPenalty);
    }

    @Test
    void getPenaltiesByMinCancelHour_RepositoryException_ThrowsException() {
        // Given
        Integer minHours = 24;
        when(penaltyRepository.findByMinCancelHourLessThanEqual(minHours)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        assertThatThrownBy(() -> penaltyService.getPenaltiesByMinCancelHour(minHours))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to get penalties by min cancel hour");
    }

    // Test countPenaltiesByUserId
    @Test
    void countPenaltiesByUserId_Success() {
        // Given
        String userId = "user123";
        List<Penalty> penalties = Arrays.asList(testPenalty);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(penaltyRepository.findByUserId(userId)).thenReturn(penalties);

        // When
        long result = penaltyService.countPenaltiesByUserId(userId);

        // Then
        assertThat(result).isEqualTo(1);
        verify(userRepository).existsById(userId);
        verify(penaltyRepository).findByUserId(userId);
    }

    @Test
    void countPenaltiesByUserId_UserNotFound_ThrowsException() {
        // Given
        String userId = "nonexistent";
        when(userRepository.existsById(userId)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> penaltyService.countPenaltiesByUserId(userId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // Test countPenaltiesByType
    @Test
    void countPenaltiesByType_Success() {
        // Given
        String penaltyType = "PERCENT";
        List<Penalty> penalties = Arrays.asList(testPenalty);

        when(penaltyRepository.findByPenaltyType(Penalty.PenaltyType.PERCENT)).thenReturn(penalties);

        // When
        long result = penaltyService.countPenaltiesByType(penaltyType);

        // Then
        assertThat(result).isEqualTo(1);
        verify(penaltyRepository).findByPenaltyType(Penalty.PenaltyType.PERCENT);
    }

    @Test
    void countPenaltiesByType_InvalidType_ThrowsException() {
        // Given
        String invalidType = "INVALID";

        // When & Then
        assertThatThrownBy(() -> penaltyService.countPenaltiesByType(invalidType))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid penalty type");
    }

    // Test isPenaltyInUse
    @Test
    void isPenaltyInUse_True() {
        // Given
        String penaltyId = "penalty123";
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenReturn(3L);

        // When
        boolean result = penaltyService.isPenaltyInUse(penaltyId);

        // Then
        assertThat(result).isTrue();
        verify(vehicleRepository).countByPenaltyId(penaltyId);
    }

    @Test
    void isPenaltyInUse_False() {
        // Given
        String penaltyId = "penalty123";
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenReturn(0L);

        // When
        boolean result = penaltyService.isPenaltyInUse(penaltyId);

        // Then
        assertThat(result).isFalse();
        verify(vehicleRepository).countByPenaltyId(penaltyId);
    }

    @Test
    void isPenaltyInUse_Exception_ReturnsFalse() {
        // Given
        String penaltyId = "penalty123";
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenThrow(new RuntimeException("Database error"));

        // When
        boolean result = penaltyService.isPenaltyInUse(penaltyId);

        // Then
        assertThat(result).isFalse();
        verify(vehicleRepository).countByPenaltyId(penaltyId);
    }

    // Test countVehiclesUsingPenalty
    @Test
    void countVehiclesUsingPenalty_Success() {
        // Given
        String penaltyId = "penalty123";
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenReturn(5L);

        // When
        long result = penaltyService.countVehiclesUsingPenalty(penaltyId);

        // Then
        assertThat(result).isEqualTo(5);
        verify(vehicleRepository).countByPenaltyId(penaltyId);
    }

    @Test
    void countVehiclesUsingPenalty_Exception_ReturnsZero() {
        // Given
        String penaltyId = "penalty123";
        when(vehicleRepository.countByPenaltyId(penaltyId)).thenThrow(new RuntimeException("Database error"));

        // When
        long result = penaltyService.countVehiclesUsingPenalty(penaltyId);

        // Then
        assertThat(result).isEqualTo(0);
        verify(vehicleRepository).countByPenaltyId(penaltyId);
    }

    // Additional edge cases for createPenalty
    @Test
    void createPenalty_EmptyUserId_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User ID is required");
    }

    @Test
    void createPenalty_EmptyPenaltyType_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty type is required");
    }

    @Test
    void createPenalty_NullPenaltyValue_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("PERCENT")
                .penaltyValue(null)
                .minCancelHour(24)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Penalty value must be greater than or equal to 0");
    }

    @Test
    void createPenalty_NullMinCancelHour_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(null)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Min cancel hour must be greater than or equal to 0");
    }

    @Test
    void createPenalty_NegativeMinCancelHour_ThrowsException() {
        // Given
        CreatePenaltyDTO invalidDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(-5)
                .description("Test penalty")
                .build();

        // When & Then
        assertThatThrownBy(() -> penaltyService.createPenalty(invalidDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Min cancel hour must be greater than or equal to 0");
    }

    // Test with FIXED penalty type
    @Test
    void createPenalty_FixedType_Success() {
        // Given
        CreatePenaltyDTO fixedDTO = CreatePenaltyDTO.builder()
                .userId("user123")
                .penaltyType("FIXED")
                .penaltyValue(BigDecimal.valueOf(50000))
                .minCancelHour(24)
                .description("Fixed penalty")
                .build();

        Penalty fixedPenalty = Penalty.builder()
                .id("penalty123")
                .user(testUser)
                .penaltyType(Penalty.PenaltyType.FIXED)
                .penaltyValue(BigDecimal.valueOf(50000))
                .minCancelHour(24)
                .description("Fixed penalty")
                .build();

        PenaltyDTO fixedPenaltyDTO = PenaltyDTO.builder()
                .id("penalty123")
                .userId("user123")
                .userName("Test User")
                .penaltyType("FIXED")
                .penaltyValue(BigDecimal.valueOf(50000))
                .minCancelHour(24)
                .description("Fixed penalty")
                .build();

        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(penaltyRepository.save(any(Penalty.class))).thenReturn(fixedPenalty);
        when(penaltyMapper.toDTO(fixedPenalty)).thenReturn(fixedPenaltyDTO);

        // When
        PenaltyDTO result = penaltyService.createPenalty(fixedDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(fixedPenaltyDTO);
        assertThat(result.getPenaltyType()).isEqualTo("FIXED");
    }
}
