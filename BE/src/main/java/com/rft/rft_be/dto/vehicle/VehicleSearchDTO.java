package com.rft.rft_be.dto.vehicle;

import com.rft.rft_be.entity.Vehicle;
import jakarta.validation.constraints.Min;
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
     String pickupDateTime;
     String returnDateTime;

     String Transmission;
     String fuelType;

     @Min(value = 1, message = "Số ghế phải ít nhất là 1.")
     Integer numberSeat;

     @Min(value = 0, message = "Giá phải là số dương.")
     Integer costFrom;

     @Min(value = 0, message = "Giá phải là số dương.")
     Integer costTo;

     List<String> features;
     Boolean ratingFiveStarsOnly;

     @Min(value = 0, message = "Số trang phải là số dương.")
     int page = 0;

     @Min(value = 1, message = "Kích cỡ trang phải ít nhất là 1.")
     int size = 12;
}

