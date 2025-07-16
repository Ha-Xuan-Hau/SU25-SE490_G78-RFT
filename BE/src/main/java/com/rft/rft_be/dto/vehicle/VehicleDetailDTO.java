package com.rft.rft_be.dto.vehicle;

import java.math.BigDecimal;
import java.util.List;

import com.rft.rft_be.dto.extraFeeRule.ExtraFeeRuleDTO;
import com.rft.rft_be.dto.penalty.PenaltyDTO;

import com.rft.rft_be.entity.ExtraFeeRule;
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
    String haveDriver;
    String insuranceStatus;
    String shipToAddress;
    String description;
    BigDecimal costPerDay;
    String status;
    String thumb;
    Integer numberSeat;
    Integer yearManufacture;
    String transmission;
    String fuelType;
    Integer numberVehicle;
    String brandName;
    String modelName;
    Integer totalRatings;
    Double rating;
    String address;
    List<UserCommentDTO> userComments;
    String openTime;
    String closeTime;
    PenaltyDTO penalty;
    ExtraFeeRuleDTO extraFeeRule;
}