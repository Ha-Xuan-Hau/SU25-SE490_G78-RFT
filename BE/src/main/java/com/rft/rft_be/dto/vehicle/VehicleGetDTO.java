package com.rft.rft_be.dto.vehicle;


import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleGetDTO {
    private String id;
    private String userId;
    private String userName;
    private String brandId;
    private String brandName;
    private String modelId;
    private String modelName;
    private String penaltyId;
    private String penaltyType;
    private BigDecimal penaltyValue;
    private Integer minCancelHour;
    private String licensePlate;
    private String vehicleType;
    private String vehicleFeatures;
    private String vehicleImages;
    private String haveDriver;
    private String insuranceStatus;
    private String shipToAddress;
    private Integer numberSeat;
    private Integer yearManufacture;
    private String transmission;
    private String fuelType;
    private String description;
    private Integer numberVehicle;
    private BigDecimal costPerDay;
    private String status;
    private String thumb;
    private Integer totalRatings;
    private Integer likes;
    private Instant createdAt;
    private Instant updatedAt;
    Double rating;
}
