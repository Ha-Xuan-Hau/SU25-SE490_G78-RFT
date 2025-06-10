package com.rft.rft_be.dto;

import ch.qos.logback.core.status.Status;
import com.rft.rft_be.entity.Vehicle;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleDTO  {
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
