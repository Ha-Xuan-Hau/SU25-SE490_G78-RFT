package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Rating;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RatingRepository extends JpaRepository<Rating, String> {
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM ratings WHERE vehicle_id = :vehicleId", nativeQuery = true)
    default void deleteByVehicleId(@Param("vehicleId") String vehicleId) {

    }
}