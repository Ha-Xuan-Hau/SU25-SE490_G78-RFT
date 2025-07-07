package com.rft.rft_be.dto.vehicle;

import com.rft.rft_be.entity.Vehicle;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleSearchDTO {
     List<String> vehicleTypes;
     String address;
     Boolean haveDriver;
     Boolean shipToAddress;
     String brandId;
     String modelId;
     Integer numberSeat;
     BigDecimal costFrom;
     BigDecimal costTo;
     String transmission;
     String fuelType;
     Boolean ratingFiveStarsOnly;
     String pickupDateTime;
     String returnDateTime;
     List<String> feature;
     int page = 0;
     int size = 12;
}


