package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, String> {
    // Trong BookingRepository.java
    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.vehicle v JOIN FETCH v.user")
    List<Booking> findAllWithUserAndVehicle();

    @Query("SELECT b FROM Booking b JOIN FETCH b.user JOIN FETCH b.vehicle v JOIN FETCH v.user WHERE b.id = :bookingId")
    Optional<Booking> findByIdWithUserAndVehicle(@Param("bookingId") String bookingId);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserId(@Param("userId") String userId);

    // Main requirement: Get bookings by userId and status
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") Booking.Status status);

    @Query("SELECT b FROM Booking b WHERE b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByStatus(@Param("status") Booking.Status status);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.timeBookingStart BETWEEN :startDate AND :endDate ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdAndTimeBookingStartBetween(@Param("userId") String userId,
                                                         @Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

}