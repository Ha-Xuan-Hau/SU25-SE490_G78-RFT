package com.rft.rft_be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVehicleDTO {
    private String licensePlate;
    private String vehicleTypes;
    private String vehicleFeatures;
    private String description;
    private BigDecimal costPerDay;
    private String status;
    private String thumb;
    private Integer numberSeat;
    private Integer yearManufacture;
    private String transmission;
    private String fuelType;

}

