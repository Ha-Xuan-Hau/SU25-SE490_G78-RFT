package com.rft.rft_be.dto.vehicle;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleSearchResultDTO {
    String id;
    String licensePlate;
    String vehicleType;
    String thumb;
    BigDecimal costPerDay;
    String status;
    String brandName;
    String modelName;
    Integer numberSeat;
    Double rating;
    String address;
    List<VehicleImageDTO> vehicleImages;
    List<String> features;
    String transmission;
    String fuelType;
}