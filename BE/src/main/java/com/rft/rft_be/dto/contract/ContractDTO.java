package com.rft.rft_be.dto.contract;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractDTO {

    private String id;
    private String bookingId;
    private String userId;
    private String providerId;
    private String userName;
    private String providerName;
    private String userPhone;
    private String userEmail;
    private String userAddress;
    private String image;
    private String status;
    private BigDecimal costSettlement;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    // Vehicle information
    private String vehicleId;
    private String vehicleLicensePlate;
    private String vehicleType;
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleNumberSeat;
    private Integer vehicleYearManufacture;
    private String vehicleTransmission;
    private String vehicleFuelType;
    private BigDecimal vehicleCostPerDay;
    private String vehicleThumb;
    private String vehicleDescription;

    // Booking information
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime bookingStartTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime bookingEndTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timeFinish;

    private String bookingAddress;
    private BigDecimal bookingTotalCost;
    private String bookingStatus;
}
