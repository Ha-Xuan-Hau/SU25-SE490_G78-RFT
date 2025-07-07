package com.rft.rft_be.dto.booking;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.Booking;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingResponseDTO {
    String id;
    UserProfileDTO user; // Người đặt
    VehicleForBookingDTO vehicle; // Xe được đặt
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
}