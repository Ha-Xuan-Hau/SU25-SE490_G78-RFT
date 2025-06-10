package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, String> {
    @Query(value = "SELECT c.* FROM contracts c INNER JOIN bookings b ON c.booking_id = b.id WHERE b.vehicle_id = :vehicleId", nativeQuery = true)
    List<Contract> findByVehicleId(@Param("vehicleId") String vehicleId);
}