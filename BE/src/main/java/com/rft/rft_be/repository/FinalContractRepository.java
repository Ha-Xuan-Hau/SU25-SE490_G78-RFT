package com.rft.rft_be.repository;

import com.rft.rft_be.entity.FinalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FinalContractRepository extends JpaRepository<FinalContract, String> {
    @Query(value = "SELECT fc.* FROM final_contracts fc " +
            "INNER JOIN contracts c ON fc.contract_id = c.id " +
            "INNER JOIN bookings b ON c.booking_id = b.id " +
            "WHERE b.vehicle_id = :vehicleId", nativeQuery = true)
    List<FinalContract> findByVehicleId(@Param("vehicleId") String vehicleId);
}