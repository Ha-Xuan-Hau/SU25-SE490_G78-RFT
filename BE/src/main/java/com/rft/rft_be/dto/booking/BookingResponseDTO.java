package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.Booking;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingResponseDTO {

    String id;
    UserProfileDTO user;

    List<VehicleForBookingDTO> vehicles;

    LocalDateTime timeBookingStart;
    LocalDateTime timeBookingEnd;
    String phoneNumber;
    String address;
    String codeTransaction;
    LocalDateTime timeTransaction;
    BigDecimal totalCost;
    Booking.Status status;
    String penaltyType;
    BigDecimal penaltyValue;
    Integer minCancelHour;
    String couponId;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Additional fields for booking calculation
    String priceType;         // "hourly" hoặc "daily"
    String rentalDuration;    // formatted duration
    BigDecimal discountAmount;
    BigDecimal driverFee;
    LocalDateTime returnedAt;
}