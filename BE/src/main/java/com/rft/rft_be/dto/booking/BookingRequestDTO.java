package com.rft.rft_be.dto.booking;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequestDTO {
     String vehicleId;
     LocalDateTime timeBookingStart;
     LocalDateTime timeBookingEnd;
     String phoneNumber;
     String address;
     String penaltyType;
     BigDecimal penaltyValue;
     Integer minCancelHour;
}
