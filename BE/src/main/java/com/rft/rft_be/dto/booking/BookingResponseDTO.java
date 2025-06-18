package com.rft.rft_be.dto.booking;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.Booking;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    Instant timeBookingStart;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    Instant timeBookingEnd;
    String phoneNumber;
    String address;
    String codeTransaction;
    BigDecimal totalCost;
    Booking.Status status;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    Instant createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    Instant updatedAt;
}