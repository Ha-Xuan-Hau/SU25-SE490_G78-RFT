package com.rft.rft_be.dto.vehicle.vehicleRent;


import com.rft.rft_be.dto.vehicle.VehicleImageDTO;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Builder
@Data
public class VehicleRentCreateDTO {

    private String brandId;
    private String modelId;
    private String penaltyId;
    private List<String> licensePlate;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;
    @NotBlank(message = "Vehicle Features is required")
    private String vehicleFeatures;
    private List<VehicleImageDTO> vehicleImages;
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

//    @Min(value = 1, message = "Number of vehicles must be at least 1")
//    private Integer numberVehicle = 1;
    private Integer numberVehicle;
    @DecimalMin(value = "0.0", inclusive = false, message = "Cost per day must be greater than 0")
    private BigDecimal costPerDay;
    private String status;
    private String thumb;

    private Integer maxKmPerDay;
    private Integer feePerExtraKm;
    private Integer allowedHourLate;
    private Integer feePerExtraHour;
    private Integer cleaningFee;
    private Integer smellRemovalFee;
    private Integer batteryChargeFeePerPercent;
    private Integer driverFeePerDay;
    private Boolean hasDriverOption;
    private Integer driverFeePerHour;
    private Boolean hasHourlyRental;

}
