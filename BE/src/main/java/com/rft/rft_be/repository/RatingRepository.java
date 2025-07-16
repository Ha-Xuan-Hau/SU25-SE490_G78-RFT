package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, String> {
    List<Rating> findAllByVehicleId(String vehicleId);
    List<Rating> findAllByUserId(String userId);
    Optional<Rating> findByBookingId(String bookingId);
    @Query("SELECT AVG(r.star) FROM Rating r WHERE r.vehicle.id = :vehicleId")
    Double findAverageByVehicleId(@Param("vehicleId") String vehicleId);
    @Query("SELECT r FROM Rating r JOIN FETCH r.user WHERE r.vehicle.id = :vehicleId")
    List<Rating> findAllWithUserByVehicleId(@Param("vehicleId") String vehicleId);
    Optional<Rating> findByBookingIdAndVehicleId(String bookingId, String vehicleId);

}