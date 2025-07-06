package com.rft.rft_be.dto.driverLicense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverLicenseDTO {
    private String id;
    private String userId;
    private String userName; // Để hiển thị tên user
    private String licenseNumber;
    private String classField;
    private String status; // VALID, EXPIRED
    private String image;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}