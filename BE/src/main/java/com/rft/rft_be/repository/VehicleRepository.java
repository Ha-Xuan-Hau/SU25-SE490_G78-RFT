package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {
        boolean existsByLicensePlate(String licensePlate);

}