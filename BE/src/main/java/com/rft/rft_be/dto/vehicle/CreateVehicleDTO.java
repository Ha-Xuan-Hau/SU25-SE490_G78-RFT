package com.rft.rft_be.dto.vehicle;


import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVehicleDTO {
    private String userId;
    private String brandId;
    private String modelId;
    private String penaltyId;
    private String licensePlate;
    private String vehicleType;
    private String vehicleFeatures;
    List<VehicleImageDTO> vehicleImages;
    private String haveDriver;
    private String insuranceStatus; // YES, NO
    private String shipToAddress; // YES, NO
    private Integer numberSeat;
    private Integer yearManufacture;
    private String transmission; // MANUAL, AUTOMATIC
    private String fuelType; // GASOLINE, ELECTRIC
    private String description;
    private Integer numberVehicle; //tuy loai xe
    private BigDecimal costPerDay;
    private String status; // AVAILABLE, UNAVAILABLE
    private String thumb;
    private Integer vehicleQuantity;
    private Boolean isMultipleVehicles;
}
