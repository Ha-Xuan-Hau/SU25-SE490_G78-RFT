package com.rft.rft_be.service;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.CreateContractDTO;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.ContractMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.ContractRepository;
import com.rft.rft_be.repository.FinalContractRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.Contract.ContractService;
import com.rft.rft_be.service.Contract.ContractServiceImpl;
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
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractMapper contractMapper;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FinalContractRepository finalContractRepository;

    @InjectMocks
    private ContractServiceImpl contractService;

    private Contract contract;
    private ContractDTO contractDTO;
    private CreateContractDTO createContractDTO;
    private Booking booking;
    private User user;
    private User provider;
    private Vehicle vehicle;
    private BookingDetail bookingDetail;
    private FinalContract finalContract;

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
                .timeBookingStart(LocalDateTime.now().plusDays(1))
                .timeBookingEnd(LocalDateTime.now().plusDays(3))
                .address("Booking Address")
                .totalCost(new BigDecimal("200.00"))
                .status(Booking.Status.PENDING)
                .codeTransaction("TXN123")
                .bookingDetails(Arrays.asList(bookingDetail))
                .build();

        // Setup Contract
        contract = Contract.builder()
                .id("contract-1")
                .booking(booking)
                .user(user)
                .image("contract-image.jpg")
                .status(Contract.Status.PROCESSING)
                .costSettlement(new BigDecimal("200.00"))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Setup ContractDTO
        contractDTO = ContractDTO.builder()
                .id("contract-1")
                .bookingId("booking-1")
                .userId("user-1")
                .providerId("provider-1")
                .userName("Test User")
                .providerName("Test Provider")
                .userPhone("1234567890")
                .userEmail("user@test.com")
                .userAddress("Test Address")
                .image("contract-image.jpg")
                .status("PROCESSING")
                .costSettlement(new BigDecimal("200.00"))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .vehicleId("vehicle-1")
                .vehicleLicensePlate("ABC123")
                .vehicleCostPerDay(new BigDecimal("100.00"))
                .bookingStartTime(LocalDateTime.now().plusDays(1))
                .bookingEndTime(LocalDateTime.now().plusDays(3))
                .bookingAddress("Booking Address")
                .bookingTotalCost(new BigDecimal("200.00"))
                .bookingStatus("PENDING")
                .build();

        // Setup CreateContractDTO
        createContractDTO = CreateContractDTO.builder()
                .bookingId("booking-1")
                .userId("user-1")
                .image("new-contract-image.jpg")
                .status("PROCESSING")
                .costSettlement(new BigDecimal("200.00"))
                .build();

        // Setup FinalContract
        finalContract = FinalContract.builder()
                .id("final-contract-1")
                .contract(contract)
                .user(user)
                .timeFinish(LocalDateTime.now().plusDays(3))
                .costSettlement(new BigDecimal("200.00"))
                .build();
    }

    // Test getAllContracts
    @Test
    void getAllContracts_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findAll()).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getAllContracts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findAll();
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getAllContracts_EmptyList() {
        // Arrange
        when(contractRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<ContractDTO> result = contractService.getAllContracts();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(contractRepository).findAll();
        verify(contractMapper, never()).toDTO(any());
    }

    // Test getContractById
    @Test
    void getContractById_Success() {
        // Arrange
        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        ContractDTO result = contractService.getContractById("contract-1");

        // Assert
        assertNotNull(result);
        assertEquals(contractDTO, result);
        verify(contractRepository).findById("contract-1");
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getContractById_NotFound() {
        // Arrange
        when(contractRepository.findById("non-existent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.getContractById("non-existent");
        });
        assertEquals("Contract not found with id: non-existent", exception.getMessage());
        verify(contractRepository).findById("non-existent");
        verify(contractMapper, never()).toDTO(any());
    }

    // Test getContractsByBookingId
    @Test
    void getContractsByBookingId_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByBookingId("booking-1")).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByBookingId("booking-1");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findByBookingId("booking-1");
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getContractsByBookingId_EmptyList() {
        // Arrange
        when(contractRepository.findByBookingId("booking-1")).thenReturn(Arrays.asList());

        // Act
        List<ContractDTO> result = contractService.getContractsByBookingId("booking-1");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(contractRepository).findByBookingId("booking-1");
        verify(contractMapper, never()).toDTO(any());
    }

    // Test getContractsByUserId
    @Test
    void getContractsByUserId_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByUserId("user-1")).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByUserId("user-1");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findByUserId("user-1");
        verify(contractMapper).toDTO(contract);
    }

    // Test getContractsByStatus
    @Test
    void getContractsByStatus_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByStatus(Contract.Status.PROCESSING)).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByStatus("PROCESSING");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findByStatus(Contract.Status.PROCESSING);
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getContractsByStatus_InvalidStatus() {
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.getContractsByStatus("INVALID_STATUS");
        });
        assertEquals("Invalid status: INVALID_STATUS. Valid values are: DRAFT, FINISHED, CANCELLED", exception.getMessage());
        verify(contractRepository, never()).findByStatus(any());
    }

    @Test
    void getContractsByStatus_CaseInsensitive() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByStatus(Contract.Status.PROCESSING)).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByStatus("processing");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(contractRepository).findByStatus(Contract.Status.PROCESSING);
    }

    // Test getContractsByUserIdAndStatus
    @Test
    void getContractsByUserIdAndStatus_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByUserIdAndStatus("user-1", Contract.Status.PROCESSING)).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByUserIdAndStatus("user-1", "PROCESSING");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findByUserIdAndStatus("user-1", Contract.Status.PROCESSING);
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getContractsByUserIdAndStatus_InvalidStatus() {
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.getContractsByUserIdAndStatus("user-1", "INVALID_STATUS");
        });
        assertEquals("Invalid status: INVALID_STATUS. Valid values are: DRAFT, FINISHED, CANCELLED", exception.getMessage());
        verify(contractRepository, never()).findByUserIdAndStatus(any(), any());
    }

    // Test getContractsByBookingIdAndStatus
    @Test
    void getContractsByBookingIdAndStatus_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByBookingIdAndStatus("booking-1", Contract.Status.PROCESSING)).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByBookingIdAndStatus("booking-1", "PROCESSING");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findByBookingIdAndStatus("booking-1", Contract.Status.PROCESSING);
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getContractsByBookingIdAndStatus_InvalidStatus() {
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.getContractsByBookingIdAndStatus("booking-1", "INVALID_STATUS");
        });
        assertEquals("Invalid status: INVALID_STATUS. Valid values are: DRAFT, FINISHED, CANCELLED", exception.getMessage());
        verify(contractRepository, never()).findByBookingIdAndStatus(any(), any());
    }

    // Test getContractsByProviderIdAndStatus
    @Test
    void getContractsByProviderIdAndStatus_Success() {
        // Arrange
        List<Contract> contracts = Arrays.asList(contract);
        when(contractRepository.findByProviderIdAndStatus("provider-1", Contract.Status.PROCESSING)).thenReturn(contracts);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        List<ContractDTO> result = contractService.getContractsByProviderIdAndStatus("provider-1", "PROCESSING");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(contractDTO, result.get(0));
        verify(contractRepository).findByProviderIdAndStatus("provider-1", Contract.Status.PROCESSING);
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void getContractsByProviderIdAndStatus_WithFinishedStatus() {
        // Arrange
        Contract finishedContract = Contract.builder()
                .id("contract-1")
                .status(Contract.Status.FINISHED)
                .build();
        List<Contract> contracts = Arrays.asList(finishedContract);
        
        // Create a new FinalContract that references the finishedContract
        FinalContract finalContractForFinished = FinalContract.builder()
                .id("final-contract-2")
                .contract(finishedContract)
                .user(user)
                .timeFinish(LocalDateTime.now().plusDays(3))
                .costSettlement(new BigDecimal("200.00"))
                .build();
        List<FinalContract> finalContracts = Arrays.asList(finalContractForFinished);
        
        when(contractRepository.findByProviderIdAndStatus("provider-1", Contract.Status.FINISHED)).thenReturn(contracts);
        when(contractMapper.toDTO(finishedContract)).thenReturn(contractDTO);
        when(finalContractRepository.findByContractId("contract-1")).thenReturn(finalContracts);

        // Act
        List<ContractDTO> result = contractService.getContractsByProviderIdAndStatus("provider-1", "FINISHED");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(contractRepository).findByProviderIdAndStatus("provider-1", Contract.Status.FINISHED);
        verify(finalContractRepository).findByContractId("contract-1");
    }

    @Test
    void getContractsByProviderIdAndStatus_InvalidStatus() {
        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.getContractsByProviderIdAndStatus("provider-1", "INVALID_STATUS");
        });
        assertEquals("Invalid status: INVALID_STATUS. Valid values are: PROCESSING, RENTING, FINISHED, CANCELLED", exception.getMessage());
        verify(contractRepository, never()).findByProviderIdAndStatus(any(), any());
    }

    // Test createContract
    @Test
    void createContract_Success() {
        // Arrange
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(contractRepository.save(any(Contract.class))).thenReturn(contract);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        ContractDTO result = contractService.createContract(createContractDTO);

        // Assert
        assertNotNull(result);
        assertEquals(contractDTO, result);
        verify(bookingRepository).findById("booking-1");
        verify(userRepository).findById("user-1");
        verify(contractRepository).save(any(Contract.class));
        verify(contractMapper).toDTO(contract);
    }

    @Test
    void createContract_WithNullStatus() {
        // Arrange
        CreateContractDTO dtoWithNullStatus = CreateContractDTO.builder()
                .bookingId("booking-1")
                .userId("user-1")
                .image("test-image.jpg")
                .costSettlement(new BigDecimal("200.00"))
                .build();

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(contractRepository.save(any(Contract.class))).thenReturn(contract);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        ContractDTO result = contractService.createContract(dtoWithNullStatus);

        // Assert
        assertNotNull(result);
        verify(contractRepository).save(argThat(contract -> 
            contract.getStatus() == Contract.Status.PROCESSING
        ));
    }

    @Test
    void createContract_MissingBookingId() {
        // Arrange
        CreateContractDTO invalidDTO = CreateContractDTO.builder()
                .userId("user-1")
                .image("test-image.jpg")
                .costSettlement(new BigDecimal("200.00"))
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContract(invalidDTO);
        });
        assertEquals("Booking ID is required", exception.getMessage());
        verify(bookingRepository, never()).findById(any());
    }

    @Test
    void createContract_MissingUserId() {
        // Arrange
        CreateContractDTO invalidDTO = CreateContractDTO.builder()
                .bookingId("booking-1")
                .image("test-image.jpg")
                .costSettlement(new BigDecimal("200.00"))
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContract(invalidDTO);
        });
        assertEquals("User ID is required", exception.getMessage());
        verify(bookingRepository, never()).findById(any());
    }

    @Test
    void createContract_BookingNotFound() {
        // Arrange
        when(bookingRepository.findById("non-existent")).thenReturn(Optional.empty());

        CreateContractDTO dto = CreateContractDTO.builder()
                .bookingId("non-existent")
                .userId("user-1")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContract(dto);
        });
        assertEquals("Booking not found with id: non-existent", exception.getMessage());
        verify(bookingRepository).findById("non-existent");
        verify(userRepository, never()).findById(any());
    }

    @Test
    void createContract_UserNotFound() {
        // Arrange
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(userRepository.findById("non-existent")).thenReturn(Optional.empty());

        CreateContractDTO dto = CreateContractDTO.builder()
                .bookingId("booking-1")
                .userId("non-existent")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContract(dto);
        });
        assertEquals("User not found with id: non-existent", exception.getMessage());
        verify(bookingRepository).findById("booking-1");
        verify(userRepository).findById("non-existent");
    }

    @Test
    void createContract_InvalidStatus() {
        // Arrange
        CreateContractDTO dtoWithInvalidStatus = CreateContractDTO.builder()
                .bookingId("booking-1")
                .userId("user-1")
                .status("INVALID_STATUS")
                .build();

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContract(dtoWithInvalidStatus);
        });
        assertEquals("Invalid status: INVALID_STATUS. Valid values are: DRAFT, FINISHED, CANCELLED", exception.getMessage());
        verify(contractRepository, never()).save(any());
    }

    // Test updateContract
    @Test
    void updateContract_Success() {
        // Arrange
        ContractDTO updateDTO = ContractDTO.builder()
                .image("updated-image.jpg")
                .costSettlement(new BigDecimal("250.00"))
                .status("FINISHED")
                .build();

        Contract updatedContract = Contract.builder()
                .id("contract-1")
                .image("updated-image.jpg")
                .costSettlement(new BigDecimal("250.00"))
                .status(Contract.Status.FINISHED)
                .build();

        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenReturn(updatedContract);
        when(contractMapper.toDTO(updatedContract)).thenReturn(contractDTO);

        // Act
        ContractDTO result = contractService.updateContract("contract-1", updateDTO);

        // Assert
        assertNotNull(result);
        verify(contractRepository).findById("contract-1");
        verify(contractRepository).save(argThat(contract -> 
            contract.getImage().equals("updated-image.jpg") &&
            contract.getCostSettlement().equals(new BigDecimal("250.00")) &&
            contract.getStatus() == Contract.Status.FINISHED
        ));
        verify(contractMapper).toDTO(updatedContract);
    }

    @Test
    void updateContract_PartialUpdate() {
        // Arrange
        ContractDTO updateDTO = ContractDTO.builder()
                .image("updated-image.jpg")
                .build();

        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenReturn(contract);
        when(contractMapper.toDTO(contract)).thenReturn(contractDTO);

        // Act
        ContractDTO result = contractService.updateContract("contract-1", updateDTO);

        // Assert
        assertNotNull(result);
        verify(contractRepository).save(argThat(contract -> 
            contract.getImage().equals("updated-image.jpg") &&
            contract.getCostSettlement().equals(new BigDecimal("200.00")) // Original value unchanged
        ));
    }

    @Test
    void updateContract_ContractNotFound() {
        // Arrange
        when(contractRepository.findById("non-existent")).thenReturn(Optional.empty());

        ContractDTO updateDTO = ContractDTO.builder()
                .image("updated-image.jpg")
                .build();

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.updateContract("non-existent", updateDTO);
        });
        assertEquals("Contract not found with id: non-existent", exception.getMessage());
        verify(contractRepository).findById("non-existent");
        verify(contractRepository, never()).save(any());
    }

    @Test
    void updateContract_InvalidStatus() {
        // Arrange
        ContractDTO updateDTO = ContractDTO.builder()
                .status("INVALID_STATUS")
                .build();

        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.updateContract("contract-1", updateDTO);
        });
        assertEquals("Invalid status: INVALID_STATUS. Valid values are: DRAFT, FINISHED, CANCELLED", exception.getMessage());
        verify(contractRepository, never()).save(any());
    }

    // Test deleteContract
    @Test
    void deleteContract_Success() {
        // Arrange
        when(contractRepository.existsById("contract-1")).thenReturn(true);
        doNothing().when(contractRepository).deleteById("contract-1");

        // Act
        contractService.deleteContract("contract-1");

        // Assert
        verify(contractRepository).existsById("contract-1");
        verify(contractRepository).deleteById("contract-1");
    }

    @Test
    void deleteContract_ContractNotFound() {
        // Arrange
        when(contractRepository.existsById("non-existent")).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.deleteContract("non-existent");
        });
        assertEquals("Contract not found with id: non-existent", exception.getMessage());
        verify(contractRepository).existsById("non-existent");
        verify(contractRepository, never()).deleteById(any());
    }

    // Test createContractByPayment
    @Test
    void createContractByPayment_Success() {
        // Arrange
        when(bookingRepository.findByCodeTransaction("TXN123")).thenReturn(Optional.of(booking));
        when(contractRepository.save(any(Contract.class))).thenReturn(contract);

        // Act
        contractService.createContractByPayment("TXN123");

        // Assert
        verify(bookingRepository).findByCodeTransaction("TXN123");
        verify(bookingRepository).save(argThat(booking -> 
            booking.getStatus() == Booking.Status.PENDING
        ));
        verify(contractRepository).save(argThat(contract -> 
            contract.getUser().equals(provider) &&
            contract.getBooking().equals(booking) &&
            contract.getCostSettlement().equals(new BigDecimal("200.00")) &&
            contract.getStatus() == Contract.Status.PROCESSING
        ));
    }

    @Test
    void createContractByPayment_BookingNotFound() {
        // Arrange
        when(bookingRepository.findByCodeTransaction("INVALID_TXN")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContractByPayment("INVALID_TXN");
        });
        assertEquals("Không tìm thấy đơn booking với mã giao dịch: INVALID_TXN", exception.getMessage());
        verify(bookingRepository).findByCodeTransaction("INVALID_TXN");
        verify(contractRepository, never()).save(any());
    }

    @Test
    void createContractByPayment_NoBookingDetails() {
        // Arrange
        Booking bookingWithoutDetails = Booking.builder()
                .id("booking-2")
                .codeTransaction("TXN456")
                .bookingDetails(Arrays.asList()) // Empty list
                .build();

        when(bookingRepository.findByCodeTransaction("TXN456")).thenReturn(Optional.of(bookingWithoutDetails));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContractByPayment("TXN456");
        });
        assertEquals("Đơn booking không chứa xe nào.", exception.getMessage());
        verify(bookingRepository).findByCodeTransaction("TXN456");
        verify(contractRepository, never()).save(any());
    }

    @Test
    void createContractByPayment_NullBookingDetails() {
        // Arrange
        Booking bookingWithNullDetails = Booking.builder()
                .id("booking-3")
                .codeTransaction("TXN789")
                .bookingDetails(null) // Null list
                .build();

        when(bookingRepository.findByCodeTransaction("TXN789")).thenReturn(Optional.of(bookingWithNullDetails));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            contractService.createContractByPayment("TXN789");
        });
        assertEquals("Đơn booking không chứa xe nào.", exception.getMessage());
        verify(bookingRepository).findByCodeTransaction("TXN789");
        verify(contractRepository, never()).save(any());
    }
}
