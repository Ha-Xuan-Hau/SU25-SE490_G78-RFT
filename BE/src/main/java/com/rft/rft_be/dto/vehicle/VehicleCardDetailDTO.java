package com.rft.rft_be.dto.vehicle;

import com.rft.rft_be.dto.extraFeeRule.ExtraFeeRuleDTO;
import com.rft.rft_be.dto.penalty.PenaltyDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleCardDetailDTO {
    private String id;
    private String userId;
    private String userName;
    private String brandId;
    private String brandName;
    private String modelId;
    private String modelName;
    private String licensePlate;
    private String vehicleType;
    private String vehicleFeatures;
    private List<VehicleImageDTO> vehicleImages;
    private String haveDriver;
    private String shipToAddress;
    private Integer numberSeat;
    private Integer yearManufacture;
    private String transmission;
    private String fuelType;
    private BigDecimal costPerDay;
    private String thumb;
    private Integer totalRatings;
    private Integer likes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double rating;
    private String address;
}
