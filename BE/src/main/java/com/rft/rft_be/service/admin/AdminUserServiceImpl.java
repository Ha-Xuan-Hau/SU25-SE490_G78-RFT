package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.repository.WalletTransactionRepository;
import com.rft.rft_be.entity.WalletTransaction;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import com.rft.rft_be.repository.DriverLicensRepository;
import com.rft.rft_be.repository.VehicleRepository;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final RatingRepository ratingRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final DriverLicensRepository driverLicenseRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    public AdminUserListResponseDTO getUsers(AdminUserSearchDTO searchDTO) {
        Pageable pageable = createPageable(searchDTO);
        Page<User> userPage = userRepository.findUsersWithFilters(
                searchDTO.getName(),
                searchDTO.getEmail(),
                searchDTO.getStatus(),
                searchDTO.getRole(),
                pageable
        );
        
        return buildUserListResponse(userPage);
    }
    @Override
    public AdminUserListResponseDTO getCustomers(AdminUserSearchDTO searchDTO) {
        searchDTO.setRole(User.Role.USER);
        return getUsers(searchDTO);
    }

    @Override
    public AdminUserListResponseDTO getProviders(AdminUserSearchDTO searchDTO) {
        searchDTO.setRole(User.Role.PROVIDER);
        return getUsers(searchDTO);
    }

    @Override
    public AdminUserDetailDTO getUserDetail(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get booking statistics
        Long totalBookings = bookingRepository.countByUserId(userId);
        Long completedBookings = bookingRepository.countByUserIdAndStatus(userId, Booking.Status.COMPLETED);
        Long cancelledBookings = bookingRepository.countByUserIdAndStatus(userId, Booking.Status.CANCELLED);
        
        // Get rating statistics
        Double averageRating = ratingRepository.findAverageRatingByUserId(userId);
        Long totalRatings = ratingRepository.countByUserId(userId);
        
        // Get wallet balance
        Double walletBalance = walletRepository.findBalanceByUserId(userId);

        // Get wallet entity for banking information
        var wallet = walletRepository.findByUserId(userId);
        String cardNumber = null;
        String bankName = null;
        String cardHolderName = null;
        if (wallet.isPresent()) {
            var walletEntity = wallet.get();
            cardNumber = walletEntity.getBankAccountNumber();
            bankName = walletEntity.getBankAccountType();
            cardHolderName = walletEntity.getBankAccountName();
        }

        // Get wallet transaction statistics
        var transactions = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long totalTransactions = transactions.size();
        BigDecimal totalSpent = BigDecimal.ZERO;
        BigDecimal totalEarned = BigDecimal.ZERO;
        for (WalletTransaction tx : transactions) {
            if (tx.getAmount() != null && tx.getStatus() == WalletTransaction.Status.APPROVED) {
                if (tx.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                    totalSpent = totalSpent.add(tx.getAmount().abs());
                } else {
                    totalEarned = totalEarned.add(tx.getAmount());
                }
            }
        }

        // Get valid licenses
        var validLicenses = driverLicenseRepository.findValidByUserId(userId);
        List<String> licenseNumbers = new ArrayList<>();
        for (var license : validLicenses) {
            if (license.getLicenseNumber() != null) {
                licenseNumbers.add(license.getLicenseNumber());
            }
        }

        // Get registered vehicles
        var userVehicles = vehicleRepository.findByUserId(userId);
        List<String> vehicleNames = new ArrayList<>();
        for (var vehicle : userVehicles) {
            if (vehicle.getThumb() != null) {
                vehicleNames.add(vehicle.getThumb());
            }
        }

        return AdminUserDetailDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .dateOfBirth(user.getDateOfBirth())
                .phone(user.getPhone())
                .address(user.getAddress())
                .status(user.getStatus())
                .role(user.getRole())
                .openTime(user.getOpenTime())
                .closeTime(user.getCloseTime())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .walletBalance(walletBalance != null ? walletBalance : 0.0)
                .totalTransactions(totalTransactions)
                .totalSpent(totalSpent.doubleValue())
                .totalEarned(totalEarned.doubleValue())
                .cardNumber(cardNumber)
                .bankName(bankName)
                .cardHolderName(cardHolderName)
                .validLicenses(licenseNumbers)
                .registeredVehicles(vehicleNames)
                .totalBookings(totalBookings)
                .completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalRatings(totalRatings)
                .build();
    }

    @Override
    public AdminUserDetailDTO updateUserStatus(String userId, AdminUserStatusUpdateDTO statusDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setStatus(statusDTO.getStatus());
        User updatedUser = userRepository.save(user);
        
        return getUserDetail(updatedUser.getId());
    }

    @Override
    public AdminUserListResponseDTO searchUsersByName(String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByFullNameContainingIgnoreCase(name, pageable);
        return buildUserListResponse(userPage);
    }

    @Override
    public AdminUserListResponseDTO searchUsersByEmail(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByEmailContainingIgnoreCase(email, pageable);
        return buildUserListResponse(userPage);
    }

    @Override
    public AdminUserListResponseDTO searchUsersByStatus(User.Status status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByStatus(status, pageable);
        return buildUserListResponse(userPage);
    }

    private Pageable createPageable(AdminUserSearchDTO searchDTO) {
        Sort sort = Sort.by(
                searchDTO.getSortDirection().equalsIgnoreCase("ASC") ? 
                Sort.Direction.ASC : Sort.Direction.DESC,
                searchDTO.getSortBy()
        );
        return PageRequest.of(searchDTO.getPage(), searchDTO.getSize(), sort);
    }

    private AdminUserListResponseDTO buildUserListResponse(Page<User> userPage) {
        List<AdminUserListDTO> userDTOs = userPage.getContent().stream()
                .map(this::convertToAdminUserListDTO)
                .collect(Collectors.toList());

        return AdminUserListResponseDTO.builder()
                .users(userDTOs)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .pageSize(userPage.getSize())
                .hasNext(userPage.hasNext())
                .hasPrevious(userPage.hasPrevious())
                .build();
    }

    private AdminUserListDTO convertToAdminUserListDTO(User user) {
        // Get basic statistics
        Long totalBookings = bookingRepository.countByUserId(user.getId());
        Long totalVehicles = vehicleRepository.countByUserId(user.getId());
        Double walletBalance = walletRepository.findBalanceByUserId(user.getId());
        
        // Get wallet transaction statistics
        var transactions = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        long totalTransactions = transactions.size();
        BigDecimal totalSpent = BigDecimal.ZERO;
        BigDecimal totalEarned = BigDecimal.ZERO;
        for (WalletTransaction tx : transactions) {
            if (tx.getAmount() != null && tx.getStatus() == WalletTransaction.Status.APPROVED) {
                if (tx.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                    totalSpent = totalSpent.add(tx.getAmount().abs());
                } else {
                    totalEarned = totalEarned.add(tx.getAmount());
                }
            }
        }

        // Get valid licenses
        var validLicenses = driverLicenseRepository.findValidByUserId(user.getId());
        List<String> licenseNumbers = new ArrayList<>();
        for (var license : validLicenses) {
            if (license.getLicenseNumber() != null) {
                licenseNumbers.add(license.getLicenseNumber());
            }
        }

        // Get registered vehicles
        var userVehicles = vehicleRepository.findByUserId(user.getId());
        List<String> vehicleNames = new ArrayList<>();
        for (var vehicle : userVehicles) {
            if (vehicle.getThumb() != null) {
                vehicleNames.add(vehicle.getThumb());
            }
        }
        
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        String openTimeStr = user.getOpenTime() != null ? user.getOpenTime().format(timeFormatter) : null;
        String closeTimeStr = user.getCloseTime() != null ? user.getCloseTime().format(timeFormatter) : null;
        
        return AdminUserListDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalBookings(totalBookings)
                .totalVehicles(totalVehicles)
                .walletBalance(walletBalance != null ? walletBalance : 0.0)
                .totalTransactions(totalTransactions)
                .totalSpent(totalSpent.doubleValue())
                .totalEarned(totalEarned.doubleValue())
                .validLicenses(licenseNumbers)
                .registeredVehicles(vehicleNames)
                .openTime(openTimeStr)
                .closeTime(closeTimeStr)
                .build();
    }
} 