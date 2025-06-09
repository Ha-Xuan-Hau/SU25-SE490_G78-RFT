package com.rft.rft_be.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleDTO {
     String id;
     String licensePlate;
     String vehicleTypes;
     String vehicleFeatures;
     String description;
     BigDecimal costPerDay;
     String status;
     String thumb;
     Integer numberSeat;
     Integer yearManufacture;
     String transmission;
     String fuelType;
     String brandName;
     String modelName;
}
