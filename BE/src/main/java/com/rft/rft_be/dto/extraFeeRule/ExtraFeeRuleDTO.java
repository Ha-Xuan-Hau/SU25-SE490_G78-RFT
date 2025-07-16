package com.rft.rft_be.dto.extraFeeRule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtraFeeRuleDTO {
    Integer maxKmPerDay;
    Integer feePerExtraKm;
    Integer allowedHourLate;
    Integer feePerExtraHour;
    Integer cleaningFee;
    Integer smellRemovalFee;
    Integer batteryChargeFeePerPercent;
    Boolean apply_batteryChargeFee;
    Integer driverFeePerDay;
    Boolean hasDriverOption;
    Integer driverFeePerHour;
    Boolean hasHourlyRental;
}
