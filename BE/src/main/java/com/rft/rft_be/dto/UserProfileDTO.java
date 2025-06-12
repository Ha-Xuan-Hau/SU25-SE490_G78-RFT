package com.rft.rft_be.dto;


import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private String id;
    private String fullName;
    private String profilePicture;
    private LocalDate dateOfBirth;
    private String phone;
    private String address;
}