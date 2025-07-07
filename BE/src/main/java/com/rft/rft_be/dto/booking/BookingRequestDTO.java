package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequestDTO {
     String vehicleId;
     LocalDateTime timeBookingStart;
     LocalDateTime timeBookingEnd;
    String fullname;
     String phoneNumber;
     String address;
    String pickupMethod; // "office" hoặc "delivery"
    String couponId;
     String penaltyType;
     BigDecimal penaltyValue;
     Integer minCancelHour;
}
