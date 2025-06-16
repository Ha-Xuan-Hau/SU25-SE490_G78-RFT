package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    @Query("SELECT v FROM Vehicle v WHERE v.user.id = :userId")
    List<Vehicle> findByUserId(@Param("userId") String userId);

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    boolean existsByLicensePlate(String licensePlate);

    @Query("SELECT v FROM Vehicle v WHERE v.status = :status")
    List<Vehicle> findByStatus(@Param("status") Vehicle.Status status);

    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType")
    List<Vehicle> findByVehicleType(@Param("vehicleType") String vehicleType);

    @Query("SELECT v FROM Vehicle v WHERE v.brand.id = :brandId")
    List<Vehicle> findByBrandId(@Param("brandId") String brandId);

    @Query("SELECT v FROM Vehicle v WHERE v.model.id = :modelId")
    List<Vehicle> findByModelId(@Param("modelId") String modelId);
}