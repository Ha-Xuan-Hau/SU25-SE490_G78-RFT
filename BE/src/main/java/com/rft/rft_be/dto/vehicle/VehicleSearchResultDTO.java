package com.rft.rft_be.dto.vehicle;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleSearchResultDTO {
     String id;
     String licensePlate;
     String vehicleTypes;
     String thumb;
     BigDecimal costPerDay;
     String status;
     String brandName;
     String modelName;
     Integer numberSeat;
     Double averageRating;
     String address;
}