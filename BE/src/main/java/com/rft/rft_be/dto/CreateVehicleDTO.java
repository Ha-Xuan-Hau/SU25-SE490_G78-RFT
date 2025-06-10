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
public class CreateVehicleDTO {
    private String userId; // ID của user sở hữu vehicle
    private String brandId; // ID của brand
    private String modelId; // ID của model
    private String licensePlate;
    private String vehicleTypes;
    private String vehicleFeatures;
    private String insuranceStatus; // YES, NO
    private String shipToAddress; // YES, NO
    private Integer numberSeat;
    private Integer yearManufacture;
    private String transmission; // MANUAL, AUTOMATIC
    private String fuelType; // GASOLINE, ELECTRIC
    private String description;
    private Integer numberVehicle;
    private BigDecimal costPerDay;
    private String status; // AVAILABLE, UNAVAILABLE
    private String thumb;
}
