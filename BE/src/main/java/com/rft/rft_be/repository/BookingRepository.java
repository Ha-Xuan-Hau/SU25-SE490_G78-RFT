package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {

    @Query(value = "SELECT * FROM bookings WHERE vehicle_id = :vehicleId AND status IN ('PENDING', 'CONFIRMED')", nativeQuery = true)
    List<Booking> findActiveBookingsByVehicleId(@Param("vehicleId") String vehicleId);

    @Query(value = "SELECT * FROM bookings WHERE vehicle_id = :vehicleId", nativeQuery = true)
    List<Booking> findAllByVehicleId(@Param("vehicleId") String vehicleId);
}