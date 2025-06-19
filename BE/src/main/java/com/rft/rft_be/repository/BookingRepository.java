package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, String> {
    // Trong BookingRepository.java
    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.vehicle v JOIN FETCH v.user")
    List<Booking> findAllWithUserAndVehicle();

    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.vehicle v JOIN FETCH v.user WHERE b.id = :bookingId")
    Optional<Booking> findByIdWithUserAndVehicle(@Param("bookingId") String bookingId);
}