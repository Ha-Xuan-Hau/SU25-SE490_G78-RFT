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
public class AdminUserListDTO {
    private String id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private User.Status status;
    private User.Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long totalBookings;
    private Long totalVehicles;
    private Double walletBalance;
    private String openTime;
    private String closeTime;
    
    // Wallet and transaction data
    private Long totalTransactions;
    private Double totalSpent;
    private Double totalEarned;
    
    // Profile related data
    private List<String> validLicenses;
    private List<String> registeredVehicles;
} 