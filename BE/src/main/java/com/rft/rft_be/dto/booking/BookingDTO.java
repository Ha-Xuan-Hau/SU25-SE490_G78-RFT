package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {

    private String id;
    private String userId;
    private String userName;
    private String vehicleId;
    private String vehicleImage;
    private String vehicleLicensePlate;
    private String vehicleType;
    private String vehicleThumb;
    // Vehicle additional information
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleNumberSeat;
    private Integer vehicleYearManufacture;
    private String vehicleTransmission;
    private String vehicleFuelType;
    private BigDecimal vehicleCostPerDay;
    private String vehicleDescription;
    private String vehicleProviderId;

    private LocalDateTime timeBookingStart;
    private LocalDateTime timeBookingEnd;
    private String phoneNumber;
    private String address;
    private String codeTransaction;
    private LocalDateTime timeTransaction;
    private BigDecimal totalCost;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Penalty information
    private String penaltyType;
    private BigDecimal penaltyValue;
    private Integer minCancelHour;
}
