package com.rft.rft_be.dto.booking;


import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

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
    private Instant timeBookingStart;
    private Instant timeBookingEnd;
    private String phoneNumber;
    private String address;
    private String codeTransaction;
    private Instant timeTransaction;
    private BigDecimal totalCost;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}