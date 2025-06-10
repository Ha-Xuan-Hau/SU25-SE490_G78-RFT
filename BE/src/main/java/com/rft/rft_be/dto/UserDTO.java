package com.rft.rft_be.dto;

import com.rft.rft_be.entity.User;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

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
    private Instant createdAt;
    private Instant updatedAt;
}