package com.rft.rft_be.dto.report;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportRequest {
    @NotBlank
    private String targetId; // userId hoặc vehicleId

    @NotBlank
    private String type; // USER_ERROR, PROVIDER_ERROR, VEHICLE_ERROR

    @NotBlank
    private String reason;
}
