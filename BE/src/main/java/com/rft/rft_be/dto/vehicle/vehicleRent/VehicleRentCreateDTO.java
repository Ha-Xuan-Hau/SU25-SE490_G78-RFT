package com.rft.rft_be.dto.vehicle.vehicleRent;


import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class VehicleRentCreateDTO {
    @NotBlank(message = "Brand ID is required")
    private String brandId;

    @NotBlank(message = "Model ID is required")
    private String modelId;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    private String vehicleFeatures;
    private String vehicleImages;
    private String haveDriver;
    private String insuranceStatus = "NO";
    private String shipToAddress = "NO";

    @Min(value = 1, message = "Number of seats must be at least 1")
    private Integer numberSeat;

    @Min(value = 1900, message = "Year manufacture must be valid")
    @Max(value = 2030, message = "Year manufacture must be valid")
    private Integer yearManufacture;

    private String transmission;
    private String fuelType;
    private String description;

    @Min(value = 1, message = "Number of vehicles must be at least 1")
    private Integer numberVehicle = 1;

    @DecimalMin(value = "0.0", inclusive = false, message = "Cost per day must be greater than 0")
    private BigDecimal costPerDay;
    private String status;
    private String thumb;
}
