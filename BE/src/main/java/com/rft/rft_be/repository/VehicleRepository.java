package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import org.springframework.stereotype.Repository;



@Repository
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

    @Query("SELECT v FROM Vehicle v " +
            "LEFT JOIN FETCH v.brand " +
            "LEFT JOIN FETCH v.model " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.user.id = :userId")
    Page<Vehicle> findByUserIdWithBrandAndModel(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT v FROM Vehicle v " +
            "LEFT JOIN FETCH v.brand " +
            "LEFT JOIN FETCH v.model " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.id = :id AND v.user.id = :userId")
    Optional<Vehicle> findByIdAndUserId(@Param("id") String id, @Param("userId") String userId);

    @Query("SELECT v FROM Vehicle v " +
            "LEFT JOIN FETCH v.brand " +
            "LEFT JOIN FETCH v.model " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.id = :id")
    Optional<Vehicle> findByIdWithBrandAndModel(@Param("id") String id);

    @Query("SELECT COUNT(v) > 0 FROM Vehicle v WHERE v.licensePlate = :licensePlate AND v.user.id = :userId AND v.id != :id")
    boolean existsByLicensePlateAndUserIdAndIdNot(@Param("licensePlate") String licensePlate,
                                                  @Param("userId") String userId,
                                                  @Param("id") String id);

    @Query("SELECT COUNT(v) > 0 FROM Vehicle v WHERE v.licensePlate = :licensePlate AND v.user.id = :userId")
    boolean existsByLicensePlateAndUserId(@Param("licensePlate") String licensePlate,
                                          @Param("userId") String userId);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.user.id = :userId")
    long countByUserId(@Param("userId") String userId);
}