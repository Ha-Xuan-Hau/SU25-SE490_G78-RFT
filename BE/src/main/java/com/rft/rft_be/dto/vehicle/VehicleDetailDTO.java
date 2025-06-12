package com.rft.rft_be.dto.vehicle;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleDetailDTO {
    String id;
    String licensePlate;
    String vehicleTypes;
    //    String vehicleFeatures;
    List<VehicleFeatureDTO> vehicleFeatures;
    List<VehicleImageDTO> vehicleImages;
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
    int rating;
    List<UserCommentDTO> userComments;
}
