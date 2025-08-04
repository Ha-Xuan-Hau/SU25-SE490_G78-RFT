package com.rft.rft_be.service;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.admin.AdminUserService;
import com.rft.rft_be.service.admin.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @Mock
    private DriverLicensRepository driverLicenseRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User testUser;
    private User testProvider;
    private AdminUserSearchDTO searchDTO;
    private AdminUserStatusUpdateDTO statusUpdateDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-1")
                .email("user@test.com")
                .fullName("Test User")
                .phone("0123456789")
                .address("Test Address")
                .status(User.Status.ACTIVE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testProvider = User.builder()
                .id("provider-1")
                .email("provider@test.com")
                .fullName("Test Provider")
                .phone("0987654321")
                .address("Provider Address")
                .status(User.Status.ACTIVE)
                .role(User.Role.PROVIDER)
                .openTime(LocalDateTime.of(LocalDate.now(), LocalTime.of(8, 0)))
                .closeTime(LocalDateTime.of(LocalDate.now(), LocalTime.of(18, 0)))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        searchDTO = AdminUserSearchDTO.builder()
                .name("test")
                .email("test@example.com")
                .status(User.Status.ACTIVE)
                .page(0)
                .size(10)
                .sortBy("createdAt")
                .sortDirection("DESC")
                .build();

        statusUpdateDTO = AdminUserStatusUpdateDTO.builder()
                .status(User.Status.INACTIVE)
                .reason("Test reason")
                .build();
    }

    @Test
    void getUsers_Success() {
        // Arrange
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser, testProvider), PageRequest.of(0, 10), 2);
        when(userRepository.findUsersWithFilters(anyString(), anyString(), any(), any(), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(5L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(2L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(1000.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getUsers().size());
        assertEquals(2, result.getTotalElements());
        assertEquals(1, result.getTotalPages());
        assertEquals(0, result.getCurrentPage());
        assertEquals(10, result.getPageSize());
        assertFalse(result.isHasNext()); // Với 2 items trên 1 page, không có next
        assertFalse(result.isHasPrevious());

        verify(userRepository).findUsersWithFilters(
                eq(searchDTO.getName()),
                eq(searchDTO.getEmail()),
                eq(searchDTO.getStatus()),
                eq(searchDTO.getRole()),
                any(Pageable.class)
        );
    }

    @Test
    void getUsers_EmptyResult() {
        // Arrange
        Page<User> emptyPage = new PageImpl<>(Arrays.asList(), PageRequest.of(0, 10), 0);
        when(userRepository.findUsersWithFilters(eq(searchDTO.getName()), eq(searchDTO.getEmail()), eq(searchDTO.getStatus()), eq(searchDTO.getRole()), any(Pageable.class)))
                .thenReturn(emptyPage);

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getUsers().size());
        assertEquals(0, result.getTotalElements());
        assertEquals(0, result.getTotalPages());
        assertFalse(result.isHasNext());
        assertFalse(result.isHasPrevious());
    }

    @Test
    void getCustomers_Success() {
        // Arrange
        searchDTO.setRole(null); // Will be set to USER in the method
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser), PageRequest.of(0, 10), 1);
        when(userRepository.findUsersWithFilters(anyString(), anyString(), any(), eq(User.Role.USER), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(3L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(500.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getCustomers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        assertEquals(User.Role.USER, result.getUsers().get(0).getRole());
    }

    @Test
    void getProviders_Success() {
        // Arrange
        searchDTO.setRole(null); // Will be set to PROVIDER in the method
        Page<User> providerPage = new PageImpl<>(Arrays.asList(testProvider), PageRequest.of(0, 10), 1);
        when(userRepository.findUsersWithFilters(anyString(), anyString(), any(), eq(User.Role.PROVIDER), any(Pageable.class)))
                .thenReturn(providerPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(10L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(5L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(2000.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getProviders(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        assertEquals(User.Role.PROVIDER, result.getUsers().get(0).getRole());
    }

    @Test
    void getUserDetail_Success() {
        // Arrange
        String userId = "user-1";
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(bookingRepository.countByUserId(userId)).thenReturn(15L);
        when(bookingRepository.countByUserIdAndStatus(userId, Booking.Status.COMPLETED)).thenReturn(12L);
        when(bookingRepository.countByUserIdAndStatus(userId, Booking.Status.CANCELLED)).thenReturn(3L);
        when(ratingRepository.findAverageRatingByUserId(userId)).thenReturn(4.5);
        when(ratingRepository.countByUserId(userId)).thenReturn(10L);
        when(walletRepository.findBalanceByUserId(userId)).thenReturn(1500.0);

        Wallet wallet = Wallet.builder()
                .bankAccountNumber("1234567890")
                .bankAccountType("Vietcombank")
                .bankAccountName("Test User")
                .build();
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));

        List<WalletTransaction> transactions = Arrays.asList(
                WalletTransaction.builder()
                        .amount(new BigDecimal("-500"))
                        .status(WalletTransaction.Status.APPROVED)
                        .build(),
                WalletTransaction.builder()
                        .amount(new BigDecimal("1000"))
                        .status(WalletTransaction.Status.APPROVED)
                        .build()
        );
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(transactions);

        DriverLicense license = DriverLicense.builder()
                .licenseNumber("B2-123456")
                .build();
        when(driverLicenseRepository.findValidByUserId(userId)).thenReturn(Arrays.asList(license));

        Vehicle vehicle = Vehicle.builder()
                .thumb("Toyota Camry")
                .build();
        when(vehicleRepository.findByUserId(userId)).thenReturn(Arrays.asList(vehicle));

        // Act
        AdminUserDetailDTO result = adminUserService.getUserDetail(userId);

        // Assert
        assertNotNull(result);
        assertEquals(userId, result.getId());
        assertEquals("user@test.com", result.getEmail());
        assertEquals("Test User", result.getFullName());
        assertEquals(User.Status.ACTIVE, result.getStatus());
        assertEquals(User.Role.USER, result.getRole());
        assertEquals(15L, result.getTotalBookings());
        assertEquals(12L, result.getCompletedBookings());
        assertEquals(3L, result.getCancelledBookings());
        assertEquals(4.5, result.getAverageRating());
        assertEquals(10L, result.getTotalRatings());
        assertEquals(1500.0, result.getWalletBalance());
        assertEquals(2L, result.getTotalTransactions());
        assertEquals(500.0, result.getTotalSpent());
        assertEquals(1000.0, result.getTotalEarned());
        assertEquals("1234567890", result.getCardNumber());
        assertEquals("Vietcombank", result.getBankName());
        assertEquals("Test User", result.getCardHolderName());
        assertEquals(1, result.getValidLicenses().size());
        assertEquals("B2-123456", result.getValidLicenses().get(0));
        assertEquals(1, result.getRegisteredVehicles().size());
        assertEquals("Toyota Camry", result.getRegisteredVehicles().get(0));
    }

    @Test
    void getUserDetail_UserNotFound() {
        // Arrange
        String userId = "non-existent";
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            adminUserService.getUserDetail(userId);
        });
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void getUserDetail_WithNullWallet() {
        // Arrange
        String userId = "user-1";
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(bookingRepository.countByUserId(userId)).thenReturn(0L);
        when(bookingRepository.countByUserIdAndStatus(userId, Booking.Status.COMPLETED)).thenReturn(0L);
        when(bookingRepository.countByUserIdAndStatus(userId, Booking.Status.CANCELLED)).thenReturn(0L);
        when(ratingRepository.findAverageRatingByUserId(userId)).thenReturn(null);
        when(ratingRepository.countByUserId(userId)).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(userId)).thenReturn(null);
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(userId)).thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(userId)).thenReturn(Arrays.asList());

        // Act
        AdminUserDetailDTO result = adminUserService.getUserDetail(userId);

        // Assert
        assertNotNull(result);
        assertEquals(0.0, result.getWalletBalance());
        assertEquals(0.0, result.getAverageRating());
        assertNull(result.getCardNumber());
        assertNull(result.getBankName());
        assertNull(result.getCardHolderName());
    }

    @Test
    void updateUserStatus_Success() {
        // Arrange
        String userId = "user-1";
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        // Mock getUserDetail dependencies
        when(bookingRepository.countByUserId(userId)).thenReturn(0L);
        when(bookingRepository.countByUserIdAndStatus(userId, Booking.Status.COMPLETED)).thenReturn(0L);
        when(bookingRepository.countByUserIdAndStatus(userId, Booking.Status.CANCELLED)).thenReturn(0L);
        when(ratingRepository.findAverageRatingByUserId(userId)).thenReturn(null);
        when(ratingRepository.countByUserId(userId)).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(userId)).thenReturn(null);
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(userId)).thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(userId)).thenReturn(Arrays.asList());

        // Act
        AdminUserDetailDTO result = adminUserService.updateUserStatus(userId, statusUpdateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(User.Status.INACTIVE, result.getStatus());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUserStatus_UserNotFound() {
        // Arrange
        String userId = "non-existent";
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            adminUserService.updateUserStatus(userId, statusUpdateDTO);
        });
        assertEquals("User not found", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void searchUsersByName_Success() {
        // Arrange
        String name = "test";
        int page = 0;
        int size = 10;
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser), PageRequest.of(0, 10), 1);
        when(userRepository.findByFullNameContainingIgnoreCase(eq(name), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(5L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(2L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(1000.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.searchUsersByName(name, page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        verify(userRepository).findByFullNameContainingIgnoreCase(eq(name), any(Pageable.class));
    }

    @Test
    void searchUsersByEmail_Success() {
        // Arrange
        String email = "test@example.com";
        int page = 0;
        int size = 10;
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser), PageRequest.of(0, 10), 1);
        when(userRepository.findByEmailContainingIgnoreCase(eq(email), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(5L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(2L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(1000.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.searchUsersByEmail(email, page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        verify(userRepository).findByEmailContainingIgnoreCase(eq(email), any(Pageable.class));
    }

    @Test
    void searchUsersByStatus_Success() {
        // Arrange
        User.Status status = User.Status.ACTIVE;
        int page = 0;
        int size = 10;
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser), PageRequest.of(0, 10), 1);
        when(userRepository.findByStatus(eq(status), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(5L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(2L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(1000.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.searchUsersByStatus(status, page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        verify(userRepository).findByStatus(eq(status), any(Pageable.class));
    }

    @Test
    void searchUsersByStatus_InactiveUsers() {
        // Arrange
        User.Status status = User.Status.INACTIVE;
        int page = 0;
        int size = 10;
        User inactiveUser = User.builder()
                .id("inactive-user")
                .email("inactive@test.com")
                .fullName("Inactive User")
                .status(User.Status.INACTIVE)
                .role(User.Role.USER)
                .build();
        Page<User> userPage = new PageImpl<>(Arrays.asList(inactiveUser), PageRequest.of(0, 10), 1);
        when(userRepository.findByStatus(eq(status), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(0L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(0.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.searchUsersByStatus(status, page, size);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        assertEquals(User.Status.INACTIVE, result.getUsers().get(0).getStatus());
    }

    @Test
    void getUsers_WithWalletTransactions() {
        // Arrange
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser), PageRequest.of(0, 10), 1);
        when(userRepository.findUsersWithFilters(eq(searchDTO.getName()), eq(searchDTO.getEmail()), eq(searchDTO.getStatus()), eq(searchDTO.getRole()), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(10L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(3L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(2500.0);

        // Mock wallet transactions with different statuses
        List<WalletTransaction> transactions = Arrays.asList(
                WalletTransaction.builder()
                        .amount(new BigDecimal("-300"))
                        .status(WalletTransaction.Status.APPROVED)
                        .build(),
                WalletTransaction.builder()
                        .amount(new BigDecimal("800"))
                        .status(WalletTransaction.Status.APPROVED)
                        .build(),
                WalletTransaction.builder()
                        .amount(new BigDecimal("-200"))
                        .status(WalletTransaction.Status.PENDING) // Should be ignored
                        .build()
        );
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(transactions);
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        AdminUserListDTO userDTO = result.getUsers().get(0);
        assertEquals(3L, userDTO.getTotalTransactions());
        assertEquals(300.0, userDTO.getTotalSpent()); // Only approved transactions
        assertEquals(800.0, userDTO.getTotalEarned()); // Only approved transactions
    }

    @Test
    void getUsers_WithLicensesAndVehicles() {
        // Arrange
        Page<User> userPage = new PageImpl<>(Arrays.asList(testProvider), PageRequest.of(0, 10), 1);
        when(userRepository.findUsersWithFilters(eq(searchDTO.getName()), eq(searchDTO.getEmail()), eq(searchDTO.getStatus()), eq(searchDTO.getRole()), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(20L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(5L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(5000.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());

        // Mock driver licenses
        List<DriverLicense> licenses = Arrays.asList(
                DriverLicense.builder().licenseNumber("B2-123456").build(),
                DriverLicense.builder().licenseNumber("C-789012").build()
        );
        when(driverLicenseRepository.findValidByUserId(anyString())).thenReturn(licenses);

        // Mock vehicles
        List<Vehicle> vehicles = Arrays.asList(
                Vehicle.builder().thumb("Toyota Camry").build(),
                Vehicle.builder().thumb("Honda Civic").build(),
                Vehicle.builder().thumb("Ford Ranger").build()
        );
        when(vehicleRepository.findByUserId(anyString())).thenReturn(vehicles);

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        AdminUserListDTO userDTO = result.getUsers().get(0);
        assertEquals(2, userDTO.getValidLicenses().size());
        assertEquals("B2-123456", userDTO.getValidLicenses().get(0));
        assertEquals("C-789012", userDTO.getValidLicenses().get(1));
        assertEquals(3, userDTO.getRegisteredVehicles().size());
        assertEquals("Toyota Camry", userDTO.getRegisteredVehicles().get(0));
        assertEquals("Honda Civic", userDTO.getRegisteredVehicles().get(1));
        assertEquals("Ford Ranger", userDTO.getRegisteredVehicles().get(2));
    }

    @Test
    void getUsers_WithNullValues() {
        // Arrange
        User userWithNulls = User.builder()
                .id("user-null")
                .email("null@test.com")
                .fullName("Null User")
                .status(User.Status.ACTIVE)
                .role(User.Role.USER)
                .build();
        Page<User> userPage = new PageImpl<>(Arrays.asList(userWithNulls), PageRequest.of(0, 10), 1);
        when(userRepository.findUsersWithFilters(eq(searchDTO.getName()), eq(searchDTO.getEmail()), eq(searchDTO.getStatus()), eq(searchDTO.getRole()), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(0L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(null);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        AdminUserListDTO userDTO = result.getUsers().get(0);
        assertEquals(0.0, userDTO.getWalletBalance()); // Should default to 0.0
        assertEquals(0, userDTO.getValidLicenses().size());
        assertEquals(0, userDTO.getRegisteredVehicles().size());
    }

    @Test
    void getUsers_WithEmptySearchDTO() {
        // Arrange
        AdminUserSearchDTO emptySearchDTO = AdminUserSearchDTO.builder()
                .page(0)
                .size(5)
                .sortBy("createdAt")
                .sortDirection("DESC")
                .build();
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser), PageRequest.of(0, 5), 1);
        when(userRepository.findUsersWithFilters(eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(0L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(0.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(emptySearchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getUsers().size());
        assertEquals(5, result.getPageSize());
    }

    @Test
    void getUsers_WithAscendingSort() {
        // Arrange
        searchDTO.setSortDirection("ASC");
        searchDTO.setSortBy("fullName");
        Page<User> userPage = new PageImpl<>(Arrays.asList(testUser, testProvider), PageRequest.of(0, 10), 2);
        when(userRepository.findUsersWithFilters(eq(searchDTO.getName()), eq(searchDTO.getEmail()), eq(searchDTO.getStatus()), eq(searchDTO.getRole()), any(Pageable.class)))
                .thenReturn(userPage);
        when(bookingRepository.countByUserId(anyString())).thenReturn(0L);
        when(vehicleRepository.countByUserId(anyString())).thenReturn(0L);
        when(walletRepository.findBalanceByUserId(anyString())).thenReturn(0.0);
        when(walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(anyString()))
                .thenReturn(Arrays.asList());
        when(driverLicenseRepository.findValidByUserId(anyString()))
                .thenReturn(Arrays.asList());
        when(vehicleRepository.findByUserId(anyString()))
                .thenReturn(Arrays.asList());

        // Act
        AdminUserListResponseDTO result = adminUserService.getUsers(searchDTO);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getUsers().size());
        verify(userRepository).findUsersWithFilters(
                eq(searchDTO.getName()),
                eq(searchDTO.getEmail()),
                eq(searchDTO.getStatus()),
                eq(searchDTO.getRole()),
                any(Pageable.class)
        );
    }
}
