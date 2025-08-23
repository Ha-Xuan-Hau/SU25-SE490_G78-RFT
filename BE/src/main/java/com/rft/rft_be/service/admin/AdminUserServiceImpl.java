package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.service.otp.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.stream.Stream;

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
    private final FinalContractRepository finalContractRepository;
    private final ContractRepository contractRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
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
                .openTime(user.getOpenTime())
                .closeTime(user.getCloseTime())
                .build();
    }

    @Override
    public List<AdminStaffActivityDTO> getStaffActivities(String staffId) {
        List<AdminStaffActivityDTO> txActivities = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(staffId).stream()
                .map(tx -> AdminStaffActivityDTO.builder()
                        .action("APPROVED_WITHDRAWAL")
                        .targetId(tx.getId())
                        .targetType("WALLET_TRANSACTION")
                        .time(tx.getUpdatedAt() != null ? tx.getUpdatedAt() : tx.getCreatedAt())
                        .build())
                .toList();

        List<AdminStaffActivityDTO> contractActivities = finalContractRepository.findByUserIdOrderByCreatedAtDesc(staffId).stream()
                .map(fc -> AdminStaffActivityDTO.builder()
                        .action("APPROVED_FINAL_CONTRACT")
                        .targetId(fc.getId())
                        .targetType("FINAL_CONTRACT")
                        .time(fc.getCreatedAt())
                        .build())
                .toList();

        return Stream.concat(txActivities.stream(), contractActivities.stream())
                .sorted(Comparator.comparing(AdminStaffActivityDTO::getTime).reversed())
                .toList();
    }
    @Override
    public List<AdminStaffActivityGroupDTO> getAllStaffActivities() {
        List<User> staffList = userRepository.findByRole(User.Role.STAFF);

        return staffList.stream().map(staff ->
                AdminStaffActivityGroupDTO.builder()
                        .staffId(staff.getId())
                        .fullName(staff.getFullName())
                        .activities(getStaffActivities(staff.getId()))
                        .build()
        ).toList();
    }

    @Override
    public AdminUserDetailDTO banUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Chỉ xử lý cho USER/PROVIDER
        if (user.getRole() == User.Role.USER) {
            long unfinished = bookingRepository.countUnfinishedByUserId(
                    user.getId(),
                    Booking.Status.COMPLETED,
                    Booking.Status.CANCELLED
            );
            user.setStatus(unfinished > 0 ? User.Status.TEMP_BANNED : User.Status.INACTIVE);
        } else if (user.getRole() == User.Role.PROVIDER) {
            long renting = contractRepository.countByProviderIdAndStatus(
                    user.getId(),
                    Contract.Status.RENTING
            );
            long unfinished = bookingRepository.countUnfinishedByUserId(
                    user.getId(),
                    Booking.Status.COMPLETED,
                    Booking.Status.CANCELLED
            );
            long activities = renting + unfinished;
            user.setStatus(activities > 0 ? User.Status.TEMP_BANNED : User.Status.INACTIVE);
        } // STAFF/ADMIN: giữ nguyên

        userRepository.save(user);
        // Trả về chi tiết để FE có đủ thông tin cập nhật
        return getUserDetail(user.getId());
    }


    // Create Staff by Admin
    @Override
    public UserDetailDTO createStaffAccount(AdminCreateStaffDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new RuntimeException("OTP không hợp lệ hoặc đã hết hạn");
        }

        User staff = new User();
        staff.setEmail(request.getEmail());
        staff.setFullName(request.getFullName());
        staff.setPassword(passwordEncoder.encode(request.getPassword()));

        staff.setAddress("N/A");
        staff.setRole(User.Role.STAFF);
        staff.setStatus(User.Status.ACTIVE);

        staff.setCreatedAt(LocalDateTime.now());



        User savedStaff = userRepository.save(staff);


        otpService.deleteOtp(request.getEmail());

        return userMapper.userToUserDetailDto(savedStaff);
    }

} 