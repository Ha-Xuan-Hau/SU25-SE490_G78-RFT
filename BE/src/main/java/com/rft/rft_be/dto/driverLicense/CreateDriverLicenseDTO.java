package com.rft.rft_be.dto.driverLicense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDriverLicenseDTO {
    private String userId;
    private String licenseNumber;
    private String classField;
    private String status; // VALID, EXPIRED
    private String image;
}
