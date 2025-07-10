package com.rft.rft_be.dto.vehicle;

import java.math.BigDecimal;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleDetailDTO {

    String id;
    String licensePlate;
    String vehicleType;
    //    String vehicleFeatures;
    List<VehicleFeatureDTO> vehicleFeatures;
    List<VehicleImageDTO> vehicleImages;
    String description;
    BigDecimal costPerDay;
    String status;
    String thumb;
    Integer numberSeat;
    String shipToAddress;
    Integer yearManufacture;
    String transmission;
    String fuelType;
    String brandName;
    String modelName;
    Double rating;
    String address;
    List<UserCommentDTO> userComments;
    String openTime;
    String closeTime;
}
