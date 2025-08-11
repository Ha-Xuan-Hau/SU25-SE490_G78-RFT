package com.rft.rft_be.dto.vehicle.vehicleRent;


import com.rft.rft_be.dto.vehicle.VehicleImageDTO;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class VehicleRentUpdateDTO {
    private String brandId;
    private String modelId;
    private String penaltyId;
    private String licensePlate;
    private String vehicleType;
    private String vehicleFeatures;
    private List<VehicleImageDTO> vehicleImages;
    private String haveDriver;
    private String insuranceStatus;
    private String shipToAddress;

    @Min(value = 1, message = "Number of seats must be at least 1")
    private Integer numberSeat;

    @Min(value = 1900, message = "Year manufacture must be valid")
    @Max(value = 2030, message = "Year manufacture must be valid")
    private Integer yearManufacture;

    private String transmission;
    private String fuelType;
    private String description;

    @Min(value = 1, message = "Number of vehicles must be at least 1")
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
    private Boolean applyBatteryChargeFee;
    private Integer batteryChargeFeePerPercent;
    private Integer driverFeePerDay;
    private Boolean hasDriverOption;
    private Integer driverFeePerHour;
    private Boolean hasHourlyRental;
}
