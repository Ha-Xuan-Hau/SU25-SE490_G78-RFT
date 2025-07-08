package com.rft.rft_be.dto.vehicle.vehicleRent;


import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
@Builder
@Data
public class VehicleRentCreateDTO {

    private String brandId;


    private String modelId;


    private String licensePlate;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;
    @NotBlank(message = "Vehicle Features is required")
    private String vehicleFeatures;
    @NotBlank(message = "Vehicle Image is required")
    private String vehicleImages;
    private String haveDriver="NO";
    private String insuranceStatus = "NO";
    private String shipToAddress = "NO";

    @Min(value = 1, message = "Number of seats must be at least 1")
    private Integer numberSeat;

    private Integer yearManufacture;

    private String transmission;
    @NotBlank(message = "Fuel type is required")
    private String fuelType;
    private String description;

    @Min(value = 1, message = "Number of vehicles must be at least 1")
    private Integer numberVehicle = 1;

    @DecimalMin(value = "0.0", inclusive = false, message = "Cost per day must be greater than 0")
    private BigDecimal costPerDay;
    private String status;
    private String thumb;
}
