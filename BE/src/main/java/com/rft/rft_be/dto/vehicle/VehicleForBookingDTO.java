package com.rft.rft_be.dto.vehicle;

import com.rft.rft_be.dto.UserProfileDTO;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleForBookingDTO {
    String id;
    UserProfileDTO user;
    String licensePlate;
    String vehicleTypes;
    String thumb;
    BigDecimal costPerDay;
    String status;
}