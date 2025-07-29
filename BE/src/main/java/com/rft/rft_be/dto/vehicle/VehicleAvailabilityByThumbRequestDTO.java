package com.rft.rft_be.dto.vehicle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleAvailabilityByThumbRequestDTO {
    private String thumb;
    private String providerId;
    private LocalDateTime from;
    private LocalDateTime to;
}
