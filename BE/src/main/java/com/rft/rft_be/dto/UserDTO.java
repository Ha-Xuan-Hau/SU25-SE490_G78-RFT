package com.rft.rft_be.dto;

import com.rft.rft_be.entity.User;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String email;
    private String fullName;
    private String profilePicture;
    private LocalDate dateOfBirth;
    private String phone;
    private String address;
    private User.Status status;
    private User.Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> validLicenses;
}