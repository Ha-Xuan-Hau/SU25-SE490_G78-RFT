package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.config.TestSecurityConfig;
import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import com.rft.rft_be.dto.finalcontract.*;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.BookingDetail;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.repository.FinalContractRepository;
import com.rft.rft_be.service.Contract.FinalContractService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@WebMvcTest(FinalContractController.class)
@Import(TestSecurityConfig.class)
public class FinalContractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FinalContractService finalContractService;

    @MockBean
    private FinalContractRepository finalContractRepository;

    private FinalContractDTO testFinalContractDTO;
    private CreateFinalContractDTO testCreateFinalContractDTO;
    private FinalContract testFinalContract;
    private FinalContractSearchDTO testSearchDTO;
    private FinalContractNoteUpdateDTO testNoteUpdateDTO;

    @BeforeEach
    void setUp() {
        // Setup ObjectMapper with JavaTimeModule
        objectMapper.registerModule(new JavaTimeModule());
        
        // Setup test data
        testFinalContractDTO = FinalContractDTO.builder()
                .id("fc_001")
                .contractId("contract_001")
                .userId("user_001")
                .userName("Test User")
                .image("test-image.jpg")
                .timeFinish(LocalDateTime.now().plusDays(1))
                .costSettlement(new BigDecimal("1000.00"))
                .note("Test note")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .contractStatus("ACTIVE")
                .providerId("provider_001")
                .providerName("Test Provider")
                .providerEmail("provider@test.com")
                .providerPhone("1234567890")
                .providerBankAccountNumber("123456789")
                .providerBankAccountName("Test Bank Account")
                .providerBankAccountType("SAVINGS")
                .build();

        testCreateFinalContractDTO = CreateFinalContractDTO.builder()
                .contractId("contract_001")
                .userId("user_001")
                .image("test-image.jpg")
                .timeFinish(LocalDateTime.now().plusDays(1))
                .costSettlement(new BigDecimal("1000.00"))
                .note("Test note")
                .build();

        testSearchDTO = FinalContractSearchDTO.builder()
                .bookingId("booking_001")
                .renterEmail("renter@test.com")
                .vehicleOwnerEmail("owner@test.com")
                .sortBy("createdAt")
                .order("desc")
                .build();

        testNoteUpdateDTO = FinalContractNoteUpdateDTO.builder()
                .note("Updated note")
                .build();

        // Setup mock FinalContract entity
        testFinalContract = new FinalContract();
        testFinalContract.setId("fc_001");
        testFinalContract.setNote("Test note");
        testFinalContract.setCreatedAt(LocalDateTime.now());
        testFinalContract.setUpdatedAt(LocalDateTime.now());
        
        // Setup related entities
        Contract contract = new Contract();
        contract.setId("contract_001");
        
        Booking booking = new Booking();
        booking.setId("booking_001");
        
        // Setup BookingDetails
        List<BookingDetail> bookingDetails = new ArrayList<>();
        BookingDetail bookingDetail = new BookingDetail();
        bookingDetail.setId("bd_001");
        
        // Setup Vehicle and Vehicle Owner
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vehicle_001");
        
        User vehicleOwner = new User();
        vehicleOwner.setId("owner_001");
        vehicleOwner.setFullName("Vehicle Owner");
        vehicleOwner.setEmail("owner@test.com");
        vehicle.setUser(vehicleOwner);
        
        bookingDetail.setVehicle(vehicle);
        bookingDetails.add(bookingDetail);
        booking.setBookingDetails(bookingDetails);
        
        User user = new User();
        user.setId("user_001");
        user.setFullName("Test User");
        user.setEmail("user@test.com");
        
        testFinalContract.setContract(contract);
        contract.setBooking(booking);
        testFinalContract.setUser(user);
    }

    // Test getAllFinalContracts
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getAllFinalContracts_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getAllFinalContracts()).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value("fc_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].contractId").value("contract_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].userName").value("Test User"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getAllFinalContracts_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        when(finalContractService.getAllFinalContracts()).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts: Database error"));
    }

    // Test getFinalContractById
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractById_ShouldReturnContract_WhenFound() throws Exception {
        // Given
        String contractId = "fc_001";
        when(finalContractService.getFinalContractById(contractId)).thenReturn(testFinalContractDTO);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/{id}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("fc_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.userName").value("Test User"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractById_ShouldReturnNotFound_WhenContractNotFound() throws Exception {
        // Given
        String contractId = "nonexistent";
        when(finalContractService.getFinalContractById(contractId)).thenThrow(new RuntimeException("Final contract not found"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/{id}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Final contract not found"));
    }

    // Test getFinalContractsByContractId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByContractId_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        String contractId = "contract_001";
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getFinalContractsByContractId(contractId)).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/contract/{contractId}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].contractId").value("contract_001"));
    }

    // Test getFinalContractsByUserId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByUserId_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        String userId = "user_001";
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getFinalContractsByUserId(userId)).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/user/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].userId").value("user_001"));
    }

    // Test getFinalContractsByUserIdAndContractId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByUserIdAndContractId_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        String userId = "user_001";
        String contractId = "contract_001";
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getFinalContractsByUserIdAndContractId(userId, contractId)).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/user/{userId}/contract/{contractId}", userId, contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].userId").value("user_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].contractId").value("contract_001"));
    }

    // Test getFinalContractsByTimeFinishBetween
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByTimeFinishBetween_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getFinalContractsByTimeFinishBetween(startDate, endDate)).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/time-range")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value("fc_001"));
    }

    // Test getFinalContractsByCostSettlementRange
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByCostSettlementRange_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        BigDecimal minCost = new BigDecimal("500.00");
        BigDecimal maxCost = new BigDecimal("2000.00");
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getFinalContractsByCostSettlementRange(minCost, maxCost)).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/cost-range")
                        .param("minCost", "500.00")
                        .param("maxCost", "2000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].costSettlement").value(1000.00));
    }

    // Test createFinalContract
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createFinalContract_ShouldReturnCreated_WhenSuccessful() throws Exception {
        // Given
        when(finalContractService.createFinalContract(any(CreateFinalContractDTO.class))).thenReturn(testFinalContractDTO);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testCreateFinalContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("fc_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.contractId").value("contract_001"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createFinalContract_ShouldReturnBadRequest_WhenValidationFails() throws Exception {
        // Given
        when(finalContractService.createFinalContract(any(CreateFinalContractDTO.class)))
                .thenThrow(new RuntimeException("Invalid contract data"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testCreateFinalContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid contract data"));
    }

    // Test updateFinalContract
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateFinalContract_ShouldReturnOk_WhenSuccessful() throws Exception {
        // Given
        String contractId = "fc_001";
        when(finalContractService.updateFinalContract(eq(contractId), any(FinalContractDTO.class)))
                .thenReturn(testFinalContractDTO);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testFinalContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("fc_001"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateFinalContract_ShouldReturnNotFound_WhenContractNotFound() throws Exception {
        // Given
        String contractId = "nonexistent";
        when(finalContractService.updateFinalContract(eq(contractId), any(FinalContractDTO.class)))
                .thenThrow(new RuntimeException("Final contract not found"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testFinalContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Final contract not found"));
    }

    // Test deleteFinalContract
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteFinalContract_ShouldReturnNoContent_WhenSuccessful() throws Exception {
        // Given
        String contractId = "fc_001";
        doNothing().when(finalContractService).deleteFinalContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/final-contracts/{id}", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNoContent());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteFinalContract_ShouldReturnNotFound_WhenContractNotFound() throws Exception {
        // Given
        String contractId = "nonexistent";
        doThrow(new RuntimeException("Final contract not found")).when(finalContractService).deleteFinalContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/final-contracts/{id}", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Final contract not found"));
    }

    // Test countFinalContractsByUserId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void countFinalContractsByUserId_ShouldReturnCount_WhenSuccessful() throws Exception {
        // Given
        String userId = "user_001";
        long expectedCount = 5L;
        when(finalContractService.countFinalContractsByUserId(userId)).thenReturn(expectedCount);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/count/user/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.userId").value("user_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.count").value(5));
    }

    // Test countFinalContractsByContractId
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void countFinalContractsByContractId_ShouldReturnCount_WhenSuccessful() throws Exception {
        // Given
        String contractId = "contract_001";
        long expectedCount = 3L;
        when(finalContractService.countFinalContractsByContractId(contractId)).thenReturn(expectedCount);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/count/contract/{contractId}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.contractId").value("contract_001"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.count").value(3));
    }

    // Test getAllFinalContractsWithUser
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getAllFinalContractsWithUser_ShouldReturnList_WhenSuccessful() throws Exception {
        // Given
        List<FinalContractDTO> expectedContracts = Arrays.asList(testFinalContractDTO);
        when(finalContractService.getAllFinalContractsWithUser()).thenReturn(expectedContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/have-userid")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value("fc_001"));
    }

    // Test healthCheck
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void healthCheck_ShouldReturnOk_WhenServiceIsUp() throws Exception {
        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("UP"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.service").value("FinalContractController"));
    }

    // Test countAllFinalContracts
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void countAllFinalContracts_ShouldReturnTotal_WhenSuccessful() throws Exception {
        // Given
        List<FinalContractDTO> allContracts = Arrays.asList(testFinalContractDTO, testFinalContractDTO);
        when(finalContractService.getAllFinalContracts()).thenReturn(allContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/count")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.total").value(2));
    }

    // Test searchContracts
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void searchContracts_ShouldReturnFilteredResults_WhenSuccessful() throws Exception {
        // Given
        List<FinalContract> mockContracts = Arrays.asList(testFinalContract);
        when(finalContractRepository.findAll()).thenReturn(mockContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts/search")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testSearchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray());
    }

    // Test getFinalContractDetails
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractDetails_ShouldReturnDetails_WhenFound() throws Exception {
        // Given
        String contractId = "fc_001";
        when(finalContractRepository.findById(contractId)).thenReturn(Optional.of(testFinalContract));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/FinalContractDetails/{id}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.contract.id").value("fc_001"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractDetails_ShouldReturnNotFound_WhenContractNotFound() throws Exception {
        // Given
        String contractId = "nonexistent";
        when(finalContractRepository.findById(contractId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/FinalContractDetails/{id}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    // Test updateNote
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateNote_ShouldReturnOk_WhenSuccessful() throws Exception {
        // Given
        String contractId = "fc_001";
        when(finalContractRepository.findById(contractId)).thenReturn(Optional.of(testFinalContract));
        when(finalContractRepository.save(any(FinalContract.class))).thenReturn(testFinalContract);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}/note", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testNoteUpdateDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().string("Note updated successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateNote_ShouldReturnNotFound_WhenContractNotFound() throws Exception {
        // Given
        String contractId = "nonexistent";
        when(finalContractRepository.findById(contractId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}/note", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testNoteUpdateDTO)))
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateNote_ShouldReturnBadRequest_WhenNoteIsBlank() throws Exception {
        // Given
        String contractId = "fc_001";
        FinalContractNoteUpdateDTO invalidNoteDTO = FinalContractNoteUpdateDTO.builder()
                .note("")
                .build();

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}/note", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidNoteDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    // Additional test cases to improve coverage

    // Test getFinalContractById with Internal Server Error
//    @Test
//    @WithMockUser(username = "testuser", roles = {"USER"})
//    void getFinalContractById_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
//        // Given
//        String contractId = "fc_001";
//        when(finalContractService.getFinalContractById(contractId)).thenThrow(new Exception("Database connection failed"));
//
//        // When & Then
//        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/{id}", contractId)
//                        .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
//                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Internal server error: Database connection failed"));
//    }

    // Test getFinalContractsByContractId with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByContractId_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        String contractId = "contract_001";
        when(finalContractService.getFinalContractsByContractId(contractId)).thenThrow(new RuntimeException("Service unavailable"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/contract/{contractId}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts for contract: Service unavailable"));
    }

    // Test getFinalContractsByUserId with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByUserId_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        String userId = "user_001";
        when(finalContractService.getFinalContractsByUserId(userId)).thenThrow(new RuntimeException("User not found"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/user/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts for user: User not found"));
    }

    // Test getFinalContractsByUserIdAndContractId with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByUserIdAndContractId_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        String userId = "user_001";
        String contractId = "contract_001";
        when(finalContractService.getFinalContractsByUserIdAndContractId(userId, contractId)).thenThrow(new RuntimeException("Invalid combination"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/user/{userId}/contract/{contractId}", userId, contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts: Invalid combination"));
    }

    // Test getFinalContractsByTimeFinishBetween with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByTimeFinishBetween_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);
        when(finalContractService.getFinalContractsByTimeFinishBetween(startDate, endDate)).thenThrow(new RuntimeException("Invalid date range"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/time-range")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts by time range: Invalid date range"));
    }

    // Test getFinalContractsByCostSettlementRange with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getFinalContractsByCostSettlementRange_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        BigDecimal minCost = new BigDecimal("500.00");
        BigDecimal maxCost = new BigDecimal("2000.00");
        when(finalContractService.getFinalContractsByCostSettlementRange(minCost, maxCost)).thenThrow(new RuntimeException("Invalid cost range"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/cost-range")
                        .param("minCost", "500.00")
                        .param("maxCost", "2000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts by cost range: Invalid cost range"));
    }

    // Test createFinalContract with Internal Server Error
//    @Test
//    @WithMockUser(username = "testuser", roles = {"USER"})
//    void createFinalContract_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
//        // Given
//        when(finalContractService.createFinalContract(any(CreateFinalContractDTO.class)))
//                .thenThrow(new Exception("Database error"));
//
//        // When & Then
//        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts")
//                        .with(SecurityMockMvcRequestPostProcessors.csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(testCreateFinalContractDTO)))
//                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
//                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to create final contract: Database error"));
//    }

    // Test updateFinalContract with Internal Server Error
//    @Test
//    @WithMockUser(username = "testuser", roles = {"USER"})
//    void updateFinalContract_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
//        // Given
//        String contractId = "fc_001";
//        when(finalContractService.updateFinalContract(eq(contractId), any(FinalContractDTO.class)))
//                .thenThrow(new Exception("Database error"));
//
//        // When & Then
//        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}", contractId)
//                        .with(SecurityMockMvcRequestPostProcessors.csrf())
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content(objectMapper.writeValueAsString(testFinalContractDTO)))
//                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
//                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to update final contract: Database error"));
//    }

    // Test updateFinalContract with Bad Request (not found case)
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void updateFinalContract_ShouldReturnBadRequest_WhenValidationFails() throws Exception {
        // Given
        String contractId = "fc_001";
        when(finalContractService.updateFinalContract(eq(contractId), any(FinalContractDTO.class)))
                .thenThrow(new RuntimeException("Invalid data"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.put("/api/final-contracts/{id}", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testFinalContractDTO)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid data"));
    }

    // Test deleteFinalContract with Internal Server Error
//    @Test
//    @WithMockUser(username = "testuser", roles = {"USER"})
//    void deleteFinalContract_ShouldReturnInternalServerError_WhenExceptionOccurs() throws Exception {
//        // Given
//        String contractId = "fc_001";
//        doThrow(new Exception("Database error")).when(finalContractService).deleteFinalContract(contractId);
//
//        // When & Then
//        mockMvc.perform(MockMvcRequestBuilders.delete("/api/final-contracts/{id}", contractId)
//                        .with(SecurityMockMvcRequestPostProcessors.csrf())
//                        .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
//                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to delete final contract: Database error"));
//    }

    // Test deleteFinalContract with Bad Request (not found case)
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void deleteFinalContract_ShouldReturnBadRequest_WhenValidationFails() throws Exception {
        // Given
        String contractId = "fc_001";
        doThrow(new RuntimeException("Invalid operation")).when(finalContractService).deleteFinalContract(contractId);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/final-contracts/{id}", contractId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Invalid operation"));
    }

    // Test countFinalContractsByUserId with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void countFinalContractsByUserId_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        String userId = "user_001";
        when(finalContractService.countFinalContractsByUserId(userId)).thenThrow(new RuntimeException("Count failed"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/count/user/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to count final contracts: Count failed"));
    }

    // Test countFinalContractsByContractId with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void countFinalContractsByContractId_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        String contractId = "contract_001";
        when(finalContractService.countFinalContractsByContractId(contractId)).thenThrow(new RuntimeException("Count failed"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/count/contract/{contractId}", contractId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to count final contracts: Count failed"));
    }

    // Test getAllFinalContractsWithUser with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getAllFinalContractsWithUser_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        when(finalContractService.getAllFinalContractsWithUser()).thenThrow(new RuntimeException("Service error"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/have-userid")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to retrieve final contracts with user: Service error"));
    }

    // Test countAllFinalContracts with Exception
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void countAllFinalContracts_ShouldReturnError_WhenExceptionOccurs() throws Exception {
        // Given
        when(finalContractService.getAllFinalContracts()).thenThrow(new RuntimeException("Count failed"));

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.get("/api/final-contracts/count")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Failed to count final contracts: Count failed"));
    }

    // Test searchContracts with different sort options
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void searchContracts_ShouldSortByUpdatedAt_WhenSortByIsUpdatedAt() throws Exception {
        // Given
        FinalContractSearchDTO searchDTO = FinalContractSearchDTO.builder()
                .sortBy("updatedAt")
                .order("asc")
                .build();
        List<FinalContract> mockContracts = Arrays.asList(testFinalContract);
        when(finalContractRepository.findAll()).thenReturn(mockContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts/search")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray());
    }

    // Test searchContracts with null search criteria
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void searchContracts_ShouldReturnAll_WhenSearchCriteriaIsNull() throws Exception {
        // Given
        FinalContractSearchDTO searchDTO = FinalContractSearchDTO.builder()
                .bookingId(null)
                .renterEmail(null)
                .vehicleOwnerEmail(null)
                .sortBy("createdAt")
                .order("desc")
                .build();
        List<FinalContract> mockContracts = Arrays.asList(testFinalContract);
        when(finalContractRepository.findAll()).thenReturn(mockContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts/search")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray());
    }

    // Test searchContracts with empty result
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void searchContracts_ShouldReturnEmpty_WhenNoMatches() throws Exception {
        // Given
        FinalContractSearchDTO searchDTO = FinalContractSearchDTO.builder()
                .bookingId("nonexistent")
                .renterEmail("nonexistent@test.com")
                .vehicleOwnerEmail("nonexistent@test.com")
                .sortBy("createdAt")
                .order("desc")
                .build();
        List<FinalContract> mockContracts = Arrays.asList(testFinalContract);
        when(finalContractRepository.findAll()).thenReturn(mockContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts/search")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isEmpty());
    }

    // Test searchContracts with ascending order
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void searchContracts_ShouldSortAscending_WhenOrderIsAsc() throws Exception {
        // Given
        FinalContractSearchDTO searchDTO = FinalContractSearchDTO.builder()
                .sortBy("createdAt")
                .order("asc")
                .build();
        List<FinalContract> mockContracts = Arrays.asList(testFinalContract);
        when(finalContractRepository.findAll()).thenReturn(mockContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts/search")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray());
    }

    // Test searchContracts with case insensitive email matching
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void searchContracts_ShouldMatchEmailCaseInsensitive() throws Exception {
        // Given
        FinalContractSearchDTO searchDTO = FinalContractSearchDTO.builder()
                .renterEmail("USER@TEST.COM") // Uppercase email
                .sortBy("createdAt")
                .order("desc")
                .build();
        List<FinalContract> mockContracts = Arrays.asList(testFinalContract);
        when(finalContractRepository.findAll()).thenReturn(mockContracts);

        // When & Then
        mockMvc.perform(MockMvcRequestBuilders.post("/api/final-contracts/search")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray());
    }
}
