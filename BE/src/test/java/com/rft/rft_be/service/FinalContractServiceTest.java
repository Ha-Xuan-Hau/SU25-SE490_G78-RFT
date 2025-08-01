package com.rft.rft_be.service;

import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import com.rft.rft_be.dto.finalcontract.FinalContractDTO;
import com.rft.rft_be.dto.wallet.WalletDTO;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.ContractMapper;
import com.rft.rft_be.repository.ContractRepository;
import com.rft.rft_be.repository.FinalContractRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.Contract.FinalContractService;
import com.rft.rft_be.service.Contract.FinalContractServiceImpl;
import com.rft.rft_be.service.wallet.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinalContractServiceTest {

    @Mock
    private FinalContractRepository finalContractRepository;

    @Mock
    private ContractMapper finalContractMapper;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletService walletService;

    @InjectMocks
    private FinalContractServiceImpl finalContractService;

    private FinalContract finalContract;
    private FinalContractDTO finalContractDTO;
    private CreateFinalContractDTO createFinalContractDTO;
    private Contract contract;
    private User user;
    private User provider;
    private Vehicle vehicle;
    private BookingDetail bookingDetail;
    private Booking booking;
    private WalletDTO walletDTO;

    @BeforeEach
    void setUp() {
        // Setup User
        user = User.builder()
                .id("user-1")
                .email("user@test.com")
                .fullName("Test User")
                .phone("1234567890")
                .address("Test Address")
                .status(User.Status.ACTIVE)
                .role(User.Role.USER)
                .build();

        provider = User.builder()
                .id("provider-1")
                .email("provider@test.com")
                .fullName("Test Provider")
                .phone("0987654321")
                .address("Provider Address")
                .status(User.Status.ACTIVE)
                .role(User.Role.PROVIDER)
                .build();

        // Setup Vehicle
        vehicle = Vehicle.builder()
                .id("vehicle-1")
                .licensePlate("ABC123")
                .user(provider)
                .costPerDay(new BigDecimal("100.00"))
                .build();

        // Setup BookingDetail
        bookingDetail = BookingDetail.builder()
                .id("booking-detail-1")
                .vehicle(vehicle)
                .build();

        // Setup Booking
        booking = Booking.builder()
                .id("booking-1")
                .user(user)
                .bookingDetails(Arrays.asList(bookingDetail))
                .build();

        // Setup Contract
        contract = Contract.builder()
                .id("contract-1")
                .booking(booking)
                .user(user)
                .status(Contract.Status.PROCESSING)
                .build();

        // Setup FinalContract
        finalContract = FinalContract.builder()
                .id("final-contract-1")
                .contract(contract)
                .user(user)
                .image("test-image.jpg")
                .timeFinish(LocalDateTime.now().plusDays(1))
                .costSettlement(new BigDecimal("500.00"))
                .note("Test note")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Setup FinalContractDTO
        finalContractDTO = FinalContractDTO.builder()
                .id("final-contract-1")
                .contractId("contract-1")
                .userId("user-1")
                .userName("Test User")
                .image("test-image.jpg")
                .timeFinish(LocalDateTime.now().plusDays(1))
                .costSettlement(new BigDecimal("500.00"))
                .note("Test note")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .contractStatus("ACTIVE")
                .providerId("provider-1")
                .providerName("Test Provider")
                .providerEmail("provider@test.com")
                .providerPhone("0987654321")
                .providerBankAccountNumber("1234567890")
                .providerBankAccountName("Test Provider")
                .providerBankAccountType("SAVINGS")
                .build();

        // Setup CreateFinalContractDTO
        createFinalContractDTO = CreateFinalContractDTO.builder()
                .contractId("contract-1")
                .userId("user-1")
                .image("test-image.jpg")
                .timeFinish(LocalDateTime.now().plusDays(1))
                .costSettlement(new BigDecimal("500.00"))
                .note("Test note")
                .build();

        // Setup WalletDTO
        walletDTO = new WalletDTO();
        walletDTO.setBankAccountNumber("1234567890");
        walletDTO.setBankAccountName("Test Provider");
        walletDTO.setBankAccountType("SAVINGS");
    }

    @Test
    void getAllFinalContracts_Success() {
        // Arrange
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findAll()).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenReturn(walletDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContracts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findAll();
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getAllFinalContracts_EmptyList() {
        // Arrange
        when(finalContractRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContracts();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findAll();
    }

    @Test
    void getAllFinalContracts_Exception() {
        // Arrange
        when(finalContractRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getAllFinalContracts());
        assertTrue(exception.getMessage().contains("Failed to get all final contracts"));
        verify(finalContractRepository).findAll();
    }

    @Test
    void getFinalContractById_Success() {
        // Arrange
        when(finalContractRepository.findById("final-contract-1")).thenReturn(Optional.of(finalContract));
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenReturn(walletDTO);

        // Act
        FinalContractDTO result = finalContractService.getFinalContractById("final-contract-1");

        // Assert
        assertNotNull(result);
        assertEquals(finalContractDTO.getId(), result.getId());
        verify(finalContractRepository).findById("final-contract-1");
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getFinalContractById_NotFound() {
        // Arrange
        when(finalContractRepository.findById("non-existent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractById("non-existent"));
        assertTrue(exception.getMessage().contains("Final contract not found"));
        verify(finalContractRepository).findById("non-existent");
    }

    @Test
    void getFinalContractById_Exception() {
        // Arrange
        when(finalContractRepository.findById("final-contract-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractById("final-contract-1"));
        assertTrue(exception.getMessage().contains("Failed to get final contract"));
        verify(finalContractRepository).findById("final-contract-1");
    }

    @Test
    void getFinalContractsByContractId_Success() {
        // Arrange
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findByContractId("contract-1")).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenReturn(walletDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByContractId("contract-1");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findByContractId("contract-1");
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getFinalContractsByContractId_EmptyList() {
        // Arrange
        when(finalContractRepository.findByContractId("contract-1")).thenReturn(Arrays.asList());

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByContractId("contract-1");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findByContractId("contract-1");
    }

    @Test
    void getFinalContractsByContractId_Exception() {
        // Arrange
        when(finalContractRepository.findByContractId("contract-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractsByContractId("contract-1"));
        assertTrue(exception.getMessage().contains("Failed to get final contracts by contract"));
        verify(finalContractRepository).findByContractId("contract-1");
    }

    @Test
    void getFinalContractsByUserId_Success() {
        // Arrange
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findByUserId("user-1")).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenReturn(walletDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByUserId("user-1");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findByUserId("user-1");
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getFinalContractsByUserId_EmptyList() {
        // Arrange
        when(finalContractRepository.findByUserId("user-1")).thenReturn(Arrays.asList());

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByUserId("user-1");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findByUserId("user-1");
    }

    @Test
    void getFinalContractsByUserId_Exception() {
        // Arrange
        when(finalContractRepository.findByUserId("user-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractsByUserId("user-1"));
        assertTrue(exception.getMessage().contains("Failed to get final contracts by user"));
        verify(finalContractRepository).findByUserId("user-1");
    }

    @Test
    void getFinalContractsByUserIdAndContractId_Success() {
        // Arrange
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findByUserIdAndContractId("user-1", "contract-1")).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenReturn(walletDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByUserIdAndContractId("user-1", "contract-1");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findByUserIdAndContractId("user-1", "contract-1");
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getFinalContractsByUserIdAndContractId_EmptyList() {
        // Arrange
        when(finalContractRepository.findByUserIdAndContractId("user-1", "contract-1")).thenReturn(Arrays.asList());

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByUserIdAndContractId("user-1", "contract-1");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findByUserIdAndContractId("user-1", "contract-1");
    }

    @Test
    void getFinalContractsByUserIdAndContractId_Exception() {
        // Arrange
        when(finalContractRepository.findByUserIdAndContractId("user-1", "contract-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractsByUserIdAndContractId("user-1", "contract-1"));
        assertTrue(exception.getMessage().contains("Failed to get final contracts by user and contract"));
        verify(finalContractRepository).findByUserIdAndContractId("user-1", "contract-1");
    }

    @Test
    void getFinalContractsByTimeFinishBetween_Success() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findByTimeFinishBetween(startDate, endDate)).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByTimeFinishBetween(startDate, endDate);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findByTimeFinishBetween(startDate, endDate);
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getFinalContractsByTimeFinishBetween_EmptyList() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);
        when(finalContractRepository.findByTimeFinishBetween(startDate, endDate)).thenReturn(Arrays.asList());

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByTimeFinishBetween(startDate, endDate);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findByTimeFinishBetween(startDate, endDate);
    }

    @Test
    void getFinalContractsByTimeFinishBetween_Exception() {
        // Arrange
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);
        when(finalContractRepository.findByTimeFinishBetween(startDate, endDate)).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractsByTimeFinishBetween(startDate, endDate));
        assertTrue(exception.getMessage().contains("Failed to get final contracts by time range"));
        verify(finalContractRepository).findByTimeFinishBetween(startDate, endDate);
    }

    @Test
    void getFinalContractsByCostSettlementRange_Success() {
        // Arrange
        BigDecimal minCost = new BigDecimal("100.00");
        BigDecimal maxCost = new BigDecimal("1000.00");
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findByCostSettlementBetween(minCost, maxCost)).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByCostSettlementRange(minCost, maxCost);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findByCostSettlementBetween(minCost, maxCost);
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getFinalContractsByCostSettlementRange_EmptyList() {
        // Arrange
        BigDecimal minCost = new BigDecimal("100.00");
        BigDecimal maxCost = new BigDecimal("1000.00");
        when(finalContractRepository.findByCostSettlementBetween(minCost, maxCost)).thenReturn(Arrays.asList());

        // Act
        List<FinalContractDTO> result = finalContractService.getFinalContractsByCostSettlementRange(minCost, maxCost);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findByCostSettlementBetween(minCost, maxCost);
    }

    @Test
    void getFinalContractsByCostSettlementRange_Exception() {
        // Arrange
        BigDecimal minCost = new BigDecimal("100.00");
        BigDecimal maxCost = new BigDecimal("1000.00");
        when(finalContractRepository.findByCostSettlementBetween(minCost, maxCost)).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.getFinalContractsByCostSettlementRange(minCost, maxCost));
        assertTrue(exception.getMessage().contains("Failed to get final contracts by cost range"));
        verify(finalContractRepository).findByCostSettlementBetween(minCost, maxCost);
    }

    @Test
    void createFinalContract_Success() {
        // Arrange
        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));
        when(finalContractRepository.save(any(FinalContract.class))).thenReturn(finalContract);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);

        // Act
        FinalContractDTO result = finalContractService.createFinalContract(createFinalContractDTO);

        // Assert
        assertNotNull(result);
        assertEquals(finalContractDTO.getId(), result.getId());
        verify(contractRepository).findById("contract-1");
        verify(finalContractRepository).save(any(FinalContract.class));
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void createFinalContract_NullContractId() {
        // Arrange
        CreateFinalContractDTO invalidDTO = CreateFinalContractDTO.builder()
                .contractId(null)
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.createFinalContract(invalidDTO));
        assertTrue(exception.getMessage().contains("Contract ID is required"));
    }

    @Test
    void createFinalContract_EmptyContractId() {
        // Arrange
        CreateFinalContractDTO invalidDTO = CreateFinalContractDTO.builder()
                .contractId("")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.createFinalContract(invalidDTO));
        assertTrue(exception.getMessage().contains("Contract ID is required"));
    }

    @Test
    void createFinalContract_ContractNotFound() {
        // Arrange
        when(contractRepository.findById("non-existent")).thenReturn(Optional.empty());

        CreateFinalContractDTO invalidDTO = CreateFinalContractDTO.builder()
                .contractId("non-existent")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.createFinalContract(invalidDTO));
        assertTrue(exception.getMessage().contains("Contract not found"));
        verify(contractRepository).findById("non-existent");
    }

    @Test
    void createFinalContract_Exception() {
        // Arrange
        when(contractRepository.findById("contract-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.createFinalContract(createFinalContractDTO));
        assertTrue(exception.getMessage().contains("Failed to create final contract"));
        verify(contractRepository).findById("contract-1");
    }

    @Test
    void updateFinalContract_Success() {
        // Arrange
        when(finalContractRepository.findById("final-contract-1")).thenReturn(Optional.of(finalContract));
        when(finalContractRepository.save(any(FinalContract.class))).thenReturn(finalContract);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);

        FinalContractDTO updateDTO = FinalContractDTO.builder()
                .image("updated-image.jpg")
                .note("Updated note")
                .build();

        // Act
        FinalContractDTO result = finalContractService.updateFinalContract("final-contract-1", updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(finalContractDTO.getId(), result.getId());
        verify(finalContractRepository).findById("final-contract-1");
        verify(finalContractRepository).save(any(FinalContract.class));
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void updateFinalContract_WithUserId() {
        // Arrange
        when(finalContractRepository.findById("final-contract-1")).thenReturn(Optional.of(finalContract));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(finalContractRepository.save(any(FinalContract.class))).thenReturn(finalContract);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);

        FinalContractDTO updateDTO = FinalContractDTO.builder()
                .userId("user-1")
                .build();

        // Act
        FinalContractDTO result = finalContractService.updateFinalContract("final-contract-1", updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(finalContractDTO.getId(), result.getId());
        verify(finalContractRepository).findById("final-contract-1");
        verify(userRepository).findById("user-1");
        verify(finalContractRepository).save(any(FinalContract.class));
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void updateFinalContract_UserNotFound() {
        // Arrange
        when(finalContractRepository.findById("final-contract-1")).thenReturn(Optional.of(finalContract));
        when(userRepository.findById("non-existent")).thenReturn(Optional.empty());

        FinalContractDTO updateDTO = FinalContractDTO.builder()
                .userId("non-existent")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.updateFinalContract("final-contract-1", updateDTO));
        assertTrue(exception.getMessage().contains("User not found"));
        verify(finalContractRepository).findById("final-contract-1");
        verify(userRepository).findById("non-existent");
    }

    @Test
    void updateFinalContract_FinalContractNotFound() {
        // Arrange
        when(finalContractRepository.findById("non-existent")).thenReturn(Optional.empty());

        FinalContractDTO updateDTO = FinalContractDTO.builder()
                .image("updated-image.jpg")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.updateFinalContract("non-existent", updateDTO));
        assertTrue(exception.getMessage().contains("Final contract not found"));
        verify(finalContractRepository).findById("non-existent");
    }

    @Test
    void updateFinalContract_Exception() {
        // Arrange
        when(finalContractRepository.findById("final-contract-1")).thenThrow(new RuntimeException("Database error"));

        FinalContractDTO updateDTO = FinalContractDTO.builder()
                .image("updated-image.jpg")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.updateFinalContract("final-contract-1", updateDTO));
        assertTrue(exception.getMessage().contains("Failed to update final contract"));
        verify(finalContractRepository).findById("final-contract-1");
    }

    @Test
    void deleteFinalContract_Success() {
        // Arrange
        when(finalContractRepository.existsById("final-contract-1")).thenReturn(true);
        doNothing().when(finalContractRepository).deleteById("final-contract-1");

        // Act
        finalContractService.deleteFinalContract("final-contract-1");

        // Assert
        verify(finalContractRepository).existsById("final-contract-1");
        verify(finalContractRepository).deleteById("final-contract-1");
    }

    @Test
    void deleteFinalContract_NotFound() {
        // Arrange
        when(finalContractRepository.existsById("non-existent")).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.deleteFinalContract("non-existent"));
        assertTrue(exception.getMessage().contains("Final contract not found"));
        verify(finalContractRepository).existsById("non-existent");
        verify(finalContractRepository, never()).deleteById(anyString());
    }

    @Test
    void deleteFinalContract_Exception() {
        // Arrange
        when(finalContractRepository.existsById("final-contract-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.deleteFinalContract("final-contract-1"));
        assertTrue(exception.getMessage().contains("Failed to delete final contract"));
        verify(finalContractRepository).existsById("final-contract-1");
    }

    @Test
    void countFinalContractsByUserId_Success() {
        // Arrange
        when(finalContractRepository.countByUserId("user-1")).thenReturn(5L);

        // Act
        long result = finalContractService.countFinalContractsByUserId("user-1");

        // Assert
        assertEquals(5L, result);
        verify(finalContractRepository).countByUserId("user-1");
    }

    @Test
    void countFinalContractsByUserId_Exception() {
        // Arrange
        when(finalContractRepository.countByUserId("user-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.countFinalContractsByUserId("user-1"));
        assertTrue(exception.getMessage().contains("Failed to count final contracts by user"));
        verify(finalContractRepository).countByUserId("user-1");
    }

    @Test
    void countFinalContractsByContractId_Success() {
        // Arrange
        when(finalContractRepository.countByContractId("contract-1")).thenReturn(3L);

        // Act
        long result = finalContractService.countFinalContractsByContractId("contract-1");

        // Assert
        assertEquals(3L, result);
        verify(finalContractRepository).countByContractId("contract-1");
    }

    @Test
    void countFinalContractsByContractId_Exception() {
        // Arrange
        when(finalContractRepository.countByContractId("contract-1")).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> finalContractService.countFinalContractsByContractId("contract-1"));
        assertTrue(exception.getMessage().contains("Failed to count final contracts by contract"));
        verify(finalContractRepository).countByContractId("contract-1");
    }

    @Test
    void getAllFinalContractsWithUser_Success() {
        // Arrange
        List<FinalContract> finalContracts = Arrays.asList(finalContract);
        when(finalContractRepository.findAll()).thenReturn(finalContracts);
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenReturn(walletDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContractsWithUser();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(finalContractDTO.getId(), result.get(0).getId());
        verify(finalContractRepository).findAll();
        verify(finalContractMapper).finalContract(finalContract);
    }

    @Test
    void getAllFinalContractsWithUser_WithNullUser() {
        // Arrange
        FinalContract finalContractWithoutUser = FinalContract.builder()
                .id("final-contract-2")
                .contract(contract)
                .user(null)
                .build();
        
        List<FinalContract> finalContracts = Arrays.asList(finalContractWithoutUser);
        when(finalContractRepository.findAll()).thenReturn(finalContracts);

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContractsWithUser();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(finalContractRepository).findAll();
    }

    @Test
    void enrichWithProviderBank_Success() {
        // Arrange
        when(finalContractRepository.findAll()).thenReturn(Arrays.asList(finalContract));
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId("provider-1")).thenReturn(walletDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContracts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(walletService).getWalletByUserId("provider-1");
    }

    @Test
    void enrichWithProviderBank_Exception() {
        // Arrange
        when(finalContractRepository.findAll()).thenReturn(Arrays.asList(finalContract));
        when(finalContractMapper.finalContract(finalContract)).thenReturn(finalContractDTO);
        when(walletService.getWalletByUserId(anyString())).thenThrow(new RuntimeException("Wallet service error"));

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContracts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        // Should not throw exception, should set bank info to null
        verify(walletService).getWalletByUserId("provider-1");
    }

    @Test
    void enrichWithProviderBank_NullProviderId() {
        // Arrange
        // Create a contract without provider (null user in vehicle)
        Vehicle vehicleWithoutProvider = Vehicle.builder()
                .id("vehicle-2")
                .licensePlate("XYZ789")
                .user(null)
                .build();
        
        BookingDetail bookingDetailWithoutProvider = BookingDetail.builder()
                .id("booking-detail-2")
                .vehicle(vehicleWithoutProvider)
                .build();
        
        Booking bookingWithoutProvider = Booking.builder()
                .id("booking-2")
                .user(user)
                .bookingDetails(Arrays.asList(bookingDetailWithoutProvider))
                .build();
        
        Contract contractWithoutProvider = Contract.builder()
                .id("contract-2")
                .booking(bookingWithoutProvider)
                .user(user)
                .build();
        
        FinalContract finalContractWithoutProvider = FinalContract.builder()
                .id("final-contract-3")
                .contract(contractWithoutProvider)
                .user(user)
                .build();

        when(finalContractRepository.findAll()).thenReturn(Arrays.asList(finalContractWithoutProvider));
        when(finalContractMapper.finalContract(finalContractWithoutProvider)).thenReturn(finalContractDTO);

        // Act
        List<FinalContractDTO> result = finalContractService.getAllFinalContracts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(walletService, never()).getWalletByUserId(anyString());
    }
}
