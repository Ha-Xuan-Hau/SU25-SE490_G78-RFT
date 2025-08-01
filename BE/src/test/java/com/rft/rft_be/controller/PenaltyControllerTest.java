package com.rft.rft_be.controller;

import com.rft.rft_be.dto.penalty.CreatePenaltyDTO;
import com.rft.rft_be.dto.penalty.PenaltyDTO;
import com.rft.rft_be.service.penalty.PenaltyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PenaltyControllerTest {

    @Mock
    private PenaltyService penaltyService;

    @InjectMocks
    private PenaltyController penaltyController;

    private PenaltyDTO penaltyDTO;
    private CreatePenaltyDTO createPenaltyDTO;
    private List<PenaltyDTO> penaltyList;

    @BeforeEach
    void setUp() {
        // Setup PenaltyDTO
        penaltyDTO = PenaltyDTO.builder()
                .id("penalty-1")
                .userId("user-1")
                .userName("Test User")
                .penaltyType("LATE_RETURN")
                .penaltyValue(new BigDecimal("50.00"))
                .minCancelHour(24)
                .description("Late return penalty")
                .build();

        // Setup CreatePenaltyDTO
        createPenaltyDTO = CreatePenaltyDTO.builder()
                .userId("user-1")
                .penaltyType("LATE_RETURN")
                .penaltyValue(new BigDecimal("50.00"))
                .minCancelHour(24)
                .description("Late return penalty")
                .build();

        // Setup penalty list
        penaltyList = Arrays.asList(penaltyDTO);
    }

    // Test 1: getPenaltiesByUserId - Success
    @Test
    void getPenaltiesByUserId_Success() {
        // Arrange
        String userId = "user-1";
        when(penaltyService.getPenaltiesByUserId(userId)).thenReturn(penaltyList);
        when(penaltyService.countPenaltiesByUserId(userId)).thenReturn(1L);

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltiesByUserId(userId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals(userId, responseBody.get("userId"));
        assertEquals(penaltyList, responseBody.get("penalties"));
        assertEquals(1L, responseBody.get("count"));

        verify(penaltyService).getPenaltiesByUserId(userId);
        verify(penaltyService).countPenaltiesByUserId(userId);
    }

    // Test 2: getPenaltiesByUserId - Exception
    @Test
    void getPenaltiesByUserId_Exception() {
        // Arrange
        String userId = "user-1";
        when(penaltyService.getPenaltiesByUserId(userId)).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltiesByUserId(userId);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));
        assertEquals(userId, responseBody.get("userId"));

        verify(penaltyService).getPenaltiesByUserId(userId);
    }

    // Test 3: createPenalty - Success
    @Test
    void createPenalty_Success() {
        // Arrange
        when(penaltyService.createPenalty(createPenaltyDTO)).thenReturn(penaltyDTO);

        // Act
        ResponseEntity<?> response = penaltyController.createPenalty(createPenaltyDTO);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty created successfully", responseBody.get("message"));
        assertEquals(penaltyDTO, responseBody.get("penalty"));

        verify(penaltyService).createPenalty(createPenaltyDTO);
    }

    // Test 4: createPenalty - Exception
    @Test
    void createPenalty_Exception() {
        // Arrange
        when(penaltyService.createPenalty(createPenaltyDTO)).thenThrow(new RuntimeException("Validation error"));

        // Act
        ResponseEntity<?> response = penaltyController.createPenalty(createPenaltyDTO);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Validation error", responseBody.get("error"));
        assertEquals(createPenaltyDTO, responseBody.get("createRequest"));

        verify(penaltyService).createPenalty(createPenaltyDTO);
    }

    // Test 5: updatePenalty - Success
    @Test
    void updatePenalty_Success() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.updatePenalty(penaltyId, penaltyDTO)).thenReturn(penaltyDTO);

        // Act
        ResponseEntity<?> response = penaltyController.updatePenalty(penaltyId, penaltyDTO);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty updated successfully", responseBody.get("message"));
        assertEquals(penaltyDTO, responseBody.get("penalty"));

        verify(penaltyService).updatePenalty(penaltyId, penaltyDTO);
    }

    // Test 6: updatePenalty - Not Found Exception
    @Test
    void updatePenalty_NotFound() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.updatePenalty(penaltyId, penaltyDTO))
                .thenThrow(new RuntimeException("Penalty not found"));

        // Act
        ResponseEntity<?> response = penaltyController.updatePenalty(penaltyId, penaltyDTO);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty not found", responseBody.get("error"));
        assertEquals(penaltyId, responseBody.get("penaltyId"));
        assertEquals(penaltyDTO, responseBody.get("updateRequest"));

        verify(penaltyService).updatePenalty(penaltyId, penaltyDTO);
    }

    // Test 7: updatePenalty - General Exception
    @Test
    void updatePenalty_GeneralException() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.updatePenalty(penaltyId, penaltyDTO))
                .thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<?> response = penaltyController.updatePenalty(penaltyId, penaltyDTO);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));

        verify(penaltyService).updatePenalty(penaltyId, penaltyDTO);
    }

    // Test 8: deletePenalty - Success
    @Test
    void deletePenalty_Success() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(false);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(0L);
        doNothing().when(penaltyService).deletePenalty(penaltyId);

        // Act
        ResponseEntity<?> response = penaltyController.deletePenalty(penaltyId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty deleted successfully", responseBody.get("message"));
        assertEquals(penaltyId, responseBody.get("deletedPenaltyId"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
        verify(penaltyService).deletePenalty(penaltyId);
    }

    // Test 9: deletePenalty - In Use
    @Test
    void deletePenalty_InUse() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(true);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(2L);

        // Act
        ResponseEntity<?> response = penaltyController.deletePenalty(penaltyId);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue(responseBody.get("error").toString().contains("Cannot delete penalty"));
        assertEquals(penaltyId, responseBody.get("penaltyId"));
        assertEquals(2L, responseBody.get("vehicleCount"));
        assertEquals(false, responseBody.get("canDelete"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
        verify(penaltyService, never()).deletePenalty(penaltyId);
    }

    // Test 10: deletePenalty - Not Found Exception
    @Test
    void deletePenalty_NotFound() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(false);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(0L);
        doThrow(new RuntimeException("Penalty not found")).when(penaltyService).deletePenalty(penaltyId);

        // Act
        ResponseEntity<?> response = penaltyController.deletePenalty(penaltyId);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty not found", responseBody.get("error"));
        assertEquals(penaltyId, responseBody.get("penaltyId"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
        verify(penaltyService).deletePenalty(penaltyId);
    }

    // Test 11: deletePenalty - In Use Exception
    @Test
    void deletePenalty_InUseException() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(false);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(0L);
        doThrow(new RuntimeException("Penalty is being used")).when(penaltyService).deletePenalty(penaltyId);

        // Act
        ResponseEntity<?> response = penaltyController.deletePenalty(penaltyId);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty is being used", responseBody.get("error"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
        verify(penaltyService).deletePenalty(penaltyId);
    }

    // Test 12: deletePenalty - General Exception
    @Test
    void deletePenalty_GeneralException() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(false);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(0L);
        doThrow(new RuntimeException("Database error")).when(penaltyService).deletePenalty(penaltyId);

        // Act
        ResponseEntity<?> response = penaltyController.deletePenalty(penaltyId);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
        verify(penaltyService).deletePenalty(penaltyId);
    }

    // Test 13: getPenaltyById - Success
    @Test
    void getPenaltyById_Success() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.getPenaltyById(penaltyId)).thenReturn(penaltyDTO);
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(false);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(0L);

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltyById(penaltyId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals(penaltyDTO, responseBody.get("penalty"));
        assertEquals(false, responseBody.get("inUse"));
        assertEquals(0L, responseBody.get("vehicleCount"));
        assertEquals(true, responseBody.get("canDelete"));

        verify(penaltyService).getPenaltyById(penaltyId);
        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
    }

    // Test 14: getPenaltyById - Not Found
    @Test
    void getPenaltyById_NotFound() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.getPenaltyById(penaltyId)).thenThrow(new RuntimeException("Penalty not found"));

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltyById(penaltyId);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Penalty not found", responseBody.get("error"));
        assertEquals(penaltyId, responseBody.get("penaltyId"));

        verify(penaltyService).getPenaltyById(penaltyId);
    }

    // Test 15: getPenaltyById - General Exception
    @Test
    void getPenaltyById_GeneralException() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.getPenaltyById(penaltyId)).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltyById(penaltyId);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));

        verify(penaltyService).getPenaltyById(penaltyId);
    }

    // Test 16: checkPenaltyUsage - Success
    @Test
    void checkPenaltyUsage_Success() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenReturn(true);
        when(penaltyService.countVehiclesUsingPenalty(penaltyId)).thenReturn(3L);

        // Act
        ResponseEntity<?> response = penaltyController.checkPenaltyUsage(penaltyId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals(penaltyId, responseBody.get("penaltyId"));
        assertEquals(true, responseBody.get("inUse"));
        assertEquals(3L, responseBody.get("vehicleCount"));
        assertEquals(false, responseBody.get("canDelete"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
        verify(penaltyService).countVehiclesUsingPenalty(penaltyId);
    }

    // Test 17: checkPenaltyUsage - Exception
    @Test
    void checkPenaltyUsage_Exception() {
        // Arrange
        String penaltyId = "penalty-1";
        when(penaltyService.isPenaltyInUse(penaltyId)).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<?> response = penaltyController.checkPenaltyUsage(penaltyId);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));
        assertEquals(penaltyId, responseBody.get("penaltyId"));

        verify(penaltyService).isPenaltyInUse(penaltyId);
    }

    // Test 18: getAllPenalties - Success
    @Test
    void getAllPenalties_Success() {
        // Arrange
        when(penaltyService.getAllPenalties()).thenReturn(penaltyList);

        // Act
        ResponseEntity<?> response = penaltyController.getAllPenalties();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals(penaltyList, responseBody.get("penalties"));
        assertEquals(1, responseBody.get("count"));

        verify(penaltyService).getAllPenalties();
    }

    // Test 19: getAllPenalties - Exception
    @Test
    void getAllPenalties_Exception() {
        // Arrange
        when(penaltyService.getAllPenalties()).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<?> response = penaltyController.getAllPenalties();

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));

        verify(penaltyService).getAllPenalties();
    }

    // Test 20: getPenaltiesByType - Success
    @Test
    void getPenaltiesByType_Success() {
        // Arrange
        String penaltyType = "LATE_RETURN";
        when(penaltyService.getPenaltiesByType(penaltyType)).thenReturn(penaltyList);
        when(penaltyService.countPenaltiesByType(penaltyType)).thenReturn(1L);

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltiesByType(penaltyType);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals(penaltyType, responseBody.get("penaltyType"));
        assertEquals(penaltyList, responseBody.get("penalties"));
        assertEquals(1L, responseBody.get("count"));

        verify(penaltyService).getPenaltiesByType(penaltyType);
        verify(penaltyService).countPenaltiesByType(penaltyType);
    }

    // Test 21: getPenaltiesByType - Exception
    @Test
    void getPenaltiesByType_Exception() {
        // Arrange
        String penaltyType = "INVALID_TYPE";
        when(penaltyService.getPenaltiesByType(penaltyType)).thenThrow(new RuntimeException("Invalid penalty type"));

        // Act
        ResponseEntity<?> response = penaltyController.getPenaltiesByType(penaltyType);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Invalid penalty type", responseBody.get("error"));
        assertEquals(penaltyType, responseBody.get("penaltyType"));

        verify(penaltyService).getPenaltiesByType(penaltyType);
    }

    // Test 22: countPenaltiesByUserId - Success
    @Test
    void countPenaltiesByUserId_Success() {
        // Arrange
        String userId = "user-1";
        when(penaltyService.countPenaltiesByUserId(userId)).thenReturn(5L);

        // Act
        ResponseEntity<?> response = penaltyController.countPenaltiesByUserId(userId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals(userId, responseBody.get("userId"));
        assertEquals(5L, responseBody.get("count"));

        verify(penaltyService).countPenaltiesByUserId(userId);
    }

    // Test 23: countPenaltiesByUserId - Exception
    @Test
    void countPenaltiesByUserId_Exception() {
        // Arrange
        String userId = "user-1";
        when(penaltyService.countPenaltiesByUserId(userId)).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<?> response = penaltyController.countPenaltiesByUserId(userId);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Database error", responseBody.get("error"));
        assertEquals(userId, responseBody.get("userId"));

        verify(penaltyService).countPenaltiesByUserId(userId);
    }

    // Test 24: healthCheck - Success
    @Test
    void healthCheck_Success() {
        // Act
        ResponseEntity<?> response = penaltyController.healthCheck();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("UP", responseBody.get("status"));
        assertEquals("PenaltyService", responseBody.get("service"));
        assertNotNull(responseBody.get("timestamp"));
    }
}
