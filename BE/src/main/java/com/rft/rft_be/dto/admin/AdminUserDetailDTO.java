package com.rft.rft_be.dto.admin;

import com.rft.rft_be.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDTO {
    private String id;
    private String email;
    private String fullName;
    private String profilePicture;
    private LocalDate dateOfBirth;
    private String phone;
    private String address;
    private User.Status status;
    private User.Role role;
    private LocalDateTime openTime;
    private LocalDateTime closeTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Payment related data
    private Double walletBalance;
    private Long totalTransactions;
    private Double totalSpent;
    private Double totalEarned;
    
    // Profile related data
    private List<String> validLicenses;
    private List<String> registeredVehicles;
    private Long totalBookings;
    private Long completedBookings;
    private Long cancelledBookings;
    private Double averageRating;
    private Long totalRatings;
} 