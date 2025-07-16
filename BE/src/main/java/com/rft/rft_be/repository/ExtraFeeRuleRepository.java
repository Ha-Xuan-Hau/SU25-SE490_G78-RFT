package com.rft.rft_be.repository;

import com.rft.rft_be.entity.ExtraFeeRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExtraFeeRuleRepository extends JpaRepository<ExtraFeeRule, String> {
    ExtraFeeRule findByVehicleId(String vehicleId);
}