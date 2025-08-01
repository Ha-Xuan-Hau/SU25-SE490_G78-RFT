package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.CreateContractDTO;
import com.rft.rft_be.service.Contract.ContractService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@AutoConfigureMockMvc
public class ContractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContractService contractService;

    private ContractDTO mockContractDTO;
    private CreateContractDTO mockCreateContractDTO;
    private List<ContractDTO> mockContractList;

    private static final String TEST_USER_ID = "user-001";

    @TestConfiguration
    static class JacksonTestConfig {
        @Bean
        public ObjectMapper objectMapper() {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            return mapper;
        }
    }

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());

        // Setup SecurityContext mock for JWT authentication
        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        JwtAuthenticationToken jwtAuthenticationToken = Mockito.mock(JwtAuthenticationToken.class);
        Jwt jwt = Mockito.mock(Jwt.class);
        
        Mockito.when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        Mockito.when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        Mockito.when(jwt.getClaim("userId")).thenReturn(TEST_USER_ID);
        
        SecurityContextHolder.setContext(securityContext);

        // Setup mock data
        mockContractDTO = ContractDTO.builder()
                .id("contract-001")
                .userId(TEST_USER_ID)
                .providerId("provider-001")
                .vehicleId("vehicle-001")
                .bookingId("booking-001")
                .bookingStartTime(LocalDateTime.now())
                .bookingEndTime(LocalDateTime.now().plusDays(7))
                .bookingTotalCost(new BigDecimal("1000.00"))
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        mockCreateContractDTO = CreateContractDTO.builder()
                .bookingId("booking-001")
                .userId(TEST_USER_ID)
                .status("DRAFT")
                .costSettlement(new BigDecimal("1000.00"))
                .build();

        mockContractList = Arrays.asList(
                mockContractDTO,
                ContractDTO.builder()
                        .id("contract-002")
                        .userId("user-002")
                        .providerId("provider-002")
                        .vehicleId("vehicle-002")
                        .bookingId("booking-002")
                        .bookingStartTime(LocalDateTime.now())
                        .bookingEndTime(LocalDateTime.now().plusDays(5))
                        .bookingTotalCost(new BigDecimal("800.00"))
                        .status("ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );
    }

    // Test getAllContracts
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getAllContracts_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        Mockito.when(contractService.getAllContracts()).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value("contract-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].bookingId").value("booking-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status").value("ACTIVE"));

        Mockito.verify(contractService).getAllContracts();
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getAllContracts_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
        // Given
        Mockito.when(contractService.getAllContracts()).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve contracts: Database error"));

        Mockito.verify(contractService).getAllContracts();
    }

    // Test getContractById
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractById_ShouldReturnContract_WhenContractExists() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.when(contractService.getContractById(contractId)).thenReturn(mockContractDTO);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("contract-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.bookingId").value("booking-001"));

        Mockito.verify(contractService).getContractById(contractId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractById_ShouldReturnNotFound_WhenContractDoesNotExist() throws Exception {
        // Given
        String contractId = "non_existent_contract";
        Mockito.when(contractService.getContractById(contractId)).thenThrow(new RuntimeException("Contract not found"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Contract not found"));

        Mockito.verify(contractService).getContractById(contractId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractById_ShouldReturnNotFound_WhenExceptionOccurs() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.when(contractService.getContractById(contractId)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).getContractById(contractId);
    }

    // Test getContractsByBookingId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByBookingId_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        String bookingId = "booking-001";
        Mockito.when(contractService.getContractsByBookingId(bookingId)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/booking/{bookingId}", bookingId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].bookingId").value("booking-001"));

        Mockito.verify(contractService).getContractsByBookingId(bookingId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByBookingId_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
        // Given
        String bookingId = "booking_001";
        Mockito.when(contractService.getContractsByBookingId(bookingId)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/booking/{bookingId}", bookingId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve contracts for booking: Database error"));

        Mockito.verify(contractService).getContractsByBookingId(bookingId);
    }

    // Test getContractsByUserId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByUserId_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        String userId = "user-001";
        Mockito.when(contractService.getContractsByUserId(userId)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/user/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].userId").value("user-001"));

        Mockito.verify(contractService).getContractsByUserId(userId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByUserId_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
        // Given
        String userId = "user_001";
        Mockito.when(contractService.getContractsByUserId(userId)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/user/{userId}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve contracts for user: Database error"));

        Mockito.verify(contractService).getContractsByUserId(userId);
    }

    // Test getContractsByStatus
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByStatus_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        String status = "ACTIVE";
        Mockito.when(contractService.getContractsByStatus(status)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/status/{status}", status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status").value("ACTIVE"));

        Mockito.verify(contractService).getContractsByStatus(status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByStatus_ShouldReturnBadRequest_WhenInvalidStatus() throws Exception {
        // Given
        String status = "INVALID_STATUS";
        Mockito.when(contractService.getContractsByStatus(status)).thenThrow(new RuntimeException("Invalid status"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/status/{status}", status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid status"));

        Mockito.verify(contractService).getContractsByStatus(status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByStatus_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String status = "DRAFT";
        Mockito.when(contractService.getContractsByStatus(status)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/status/{status}", status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).getContractsByStatus(status);
    }

    // Test getContractsByUserIdAndStatus
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByUserIdAndStatus_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        String userId = "user-001";
        String status = "ACTIVE";
        Mockito.when(contractService.getContractsByUserIdAndStatus(userId, status)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/user/{userId}/status/{status}", userId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].userId").value("user-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status").value("ACTIVE"));

        Mockito.verify(contractService).getContractsByUserIdAndStatus(userId, status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByUserIdAndStatus_ShouldReturnBadRequest_WhenInvalidStatus() throws Exception {
        // Given
        String userId = "user_001";
        String status = "INVALID_STATUS";
        Mockito.when(contractService.getContractsByUserIdAndStatus(userId, status)).thenThrow(new RuntimeException("Invalid status"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/user/{userId}/status/{status}", userId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid status"));

        Mockito.verify(contractService).getContractsByUserIdAndStatus(userId, status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByUserIdAndStatus_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String userId = "user-001";
        String status = "DRAFT";
        Mockito.when(contractService.getContractsByUserIdAndStatus(userId, status)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/user/{userId}/status/{status}", userId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).getContractsByUserIdAndStatus(userId, status);
    }

    // Test getContractsByBookingIdAndStatus
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByBookingIdAndStatus_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        String bookingId = "booking-001";
        String status = "ACTIVE";
        Mockito.when(contractService.getContractsByBookingIdAndStatus(bookingId, status)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/booking/{bookingId}/status/{status}", bookingId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].bookingId").value("booking-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status").value("ACTIVE"));

        Mockito.verify(contractService).getContractsByBookingIdAndStatus(bookingId, status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByBookingIdAndStatus_ShouldReturnBadRequest_WhenInvalidStatus() throws Exception {
        // Given
        String bookingId = "booking_001";
        String status = "INVALID_STATUS";
        Mockito.when(contractService.getContractsByBookingIdAndStatus(bookingId, status)).thenThrow(new RuntimeException("Invalid status"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/booking/{bookingId}/status/{status}", bookingId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid status"));

        Mockito.verify(contractService).getContractsByBookingIdAndStatus(bookingId, status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByBookingIdAndStatus_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String bookingId = "booking-001";
        String status = "DRAFT";
        Mockito.when(contractService.getContractsByBookingIdAndStatus(bookingId, status)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/booking/{bookingId}/status/{status}", bookingId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).getContractsByBookingIdAndStatus(bookingId, status);
    }

    // Test createContract
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createContract_ShouldReturnCreatedContract_WhenSuccessful() throws Exception {
        // Given
        Mockito.when(contractService.createContract(any(CreateContractDTO.class))).thenReturn(mockContractDTO);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockCreateContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("contract-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.bookingId").value("booking-001"));

        Mockito.verify(contractService).createContract(any(CreateContractDTO.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createContract_ShouldReturnBadRequest_WhenInvalidData() throws Exception {
        // Given
        Mockito.when(contractService.createContract(any(CreateContractDTO.class))).thenThrow(new RuntimeException("Invalid contract data"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockCreateContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid contract data"));

        Mockito.verify(contractService).createContract(any(CreateContractDTO.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createContract_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        Mockito.when(contractService.createContract(any(CreateContractDTO.class))).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockCreateContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).createContract(any(CreateContractDTO.class));
    }

    // Test updateContract
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateContract_ShouldReturnUpdatedContract_WhenSuccessful() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.when(contractService.updateContract(eq(contractId), any(ContractDTO.class))).thenReturn(mockContractDTO);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .put("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("contract-001"));

        Mockito.verify(contractService).updateContract(eq(contractId), any(ContractDTO.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateContract_ShouldReturnNotFound_WhenContractDoesNotExist() throws Exception {
        // Given
        String contractId = "non_existent_contract";
        Mockito.when(contractService.updateContract(eq(contractId), any(ContractDTO.class))).thenThrow(new RuntimeException("Contract not found"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .put("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Contract not found"));

        Mockito.verify(contractService).updateContract(eq(contractId), any(ContractDTO.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateContract_ShouldReturnBadRequest_WhenInvalidData() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.when(contractService.updateContract(eq(contractId), any(ContractDTO.class))).thenThrow(new RuntimeException("Invalid contract data"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .put("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid contract data"));

        Mockito.verify(contractService).updateContract(eq(contractId), any(ContractDTO.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateContract_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.when(contractService.updateContract(eq(contractId), any(ContractDTO.class))).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .put("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).updateContract(eq(contractId), any(ContractDTO.class));
    }

    // Test deleteContract
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteContract_ShouldReturnNoContent_WhenSuccessful() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.doNothing().when(contractService).deleteContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .delete("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        Mockito.verify(contractService).deleteContract(contractId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteContract_ShouldReturnNotFound_WhenContractDoesNotExist() throws Exception {
        // Given
        String contractId = "non_existent_contract";
        Mockito.doThrow(new RuntimeException("Contract not found")).when(contractService).deleteContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .delete("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Contract not found"));

        Mockito.verify(contractService).deleteContract(contractId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteContract_ShouldReturnBadRequest_WhenInvalidData() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.doThrow(new RuntimeException("Invalid contract data")).when(contractService).deleteContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .delete("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid contract data"));

        Mockito.verify(contractService).deleteContract(contractId);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteContract_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String contractId = "contract-001";
        Mockito.doThrow(new RuntimeException("Database error")).when(contractService).deleteContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .delete("/api/contracts/{id}", contractId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).deleteContract(contractId);
    }

    // Test getContractCount
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractCount_ShouldReturnCount_WhenSuccessful() throws Exception {
        // Given
        Mockito.when(contractService.getAllContracts()).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.total").value(2));

        Mockito.verify(contractService).getAllContracts();
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractCount_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
        // Given
        Mockito.when(contractService.getAllContracts()).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to get count: Database error"));

        Mockito.verify(contractService).getAllContracts();
    }

    // Test getContractCountByStatus
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractCountByStatus_ShouldReturnCount_WhenSuccessful() throws Exception {
        // Given
        String status = "ACTIVE";
        Mockito.when(contractService.getContractsByStatus(status)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/count/status/{status}", status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("ACTIVE"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.count").value(2));

        Mockito.verify(contractService).getContractsByStatus(status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractCountByStatus_ShouldReturnBadRequest_WhenInvalidStatus() throws Exception {
        // Given
        String status = "INVALID_STATUS";
        Mockito.when(contractService.getContractsByStatus(status)).thenThrow(new RuntimeException("Invalid status"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/count/status/{status}", status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid status"));

        Mockito.verify(contractService).getContractsByStatus(status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractCountByStatus_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String status = "DRAFT";
        Mockito.when(contractService.getContractsByStatus(status)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/count/status/{status}", status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).getContractsByStatus(status);
    }

    // Test getContractsByProviderIdAndStatus
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByProviderIdAndStatus_ShouldReturnContracts_WhenSuccessful() throws Exception {
        // Given
        String providerId = "provider-001";
        String status = "ACTIVE";
        Mockito.when(contractService.getContractsByProviderIdAndStatus(providerId, status)).thenReturn(mockContractList);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/provider/{providerId}/status/{status}", providerId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].providerId").value("provider-001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].status").value("ACTIVE"));

        Mockito.verify(contractService).getContractsByProviderIdAndStatus(providerId, status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByProviderIdAndStatus_ShouldReturnBadRequest_WhenInvalidStatus() throws Exception {
        // Given
        String providerId = "provider_001";
        String status = "INVALID_STATUS";
        Mockito.when(contractService.getContractsByProviderIdAndStatus(providerId, status)).thenThrow(new RuntimeException("Invalid status"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/provider/{providerId}/status/{status}", providerId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid status"));

        Mockito.verify(contractService).getContractsByProviderIdAndStatus(providerId, status);
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getContractsByProviderIdAndStatus_ShouldReturnBadRequest_WhenExceptionOccurs() throws Exception {
        // Given
        String providerId = "provider-001";
        String status = "DRAFT";
        Mockito.when(contractService.getContractsByProviderIdAndStatus(providerId, status)).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders
                .get("/api/contracts/provider/{providerId}/status/{status}", providerId, status)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Database error"));

        Mockito.verify(contractService).getContractsByProviderIdAndStatus(providerId, status);
    }
}
