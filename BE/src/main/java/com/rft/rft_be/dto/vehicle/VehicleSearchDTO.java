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
     List<String> addresses;
     Vehicle.HaveDriver haveDriver;
     Vehicle.ShipToAddress shipToAddress;

     String brandId;
     String modelId;

     Integer numberSeat;
     Integer costFrom;
     Integer costTo;

     Boolean ratingFiveStarsOnly;

     int page = 0;
     int size = 10;
}


