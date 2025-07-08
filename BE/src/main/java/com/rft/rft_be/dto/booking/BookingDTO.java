package com.rft.rft_be.dto.booking;


import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {
    private String id;
    private String userId;
    private String userName;
    private String vehicleId;
    private String vehicleLicensePlate;
    private String vehicleType;
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
}