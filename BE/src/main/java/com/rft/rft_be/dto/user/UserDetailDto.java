package com.rft.rft_be.dto.user;

import com.rft.rft_be.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDetailDto {
    String id;
    String email;
    String password;
    String fullName;
    String profilePicture;
    LocalDate dateOfBirth;
    String phone;
    String address;
    String status;
    String role;
    Instant createdAt;
    Instant updatedAt;
}
