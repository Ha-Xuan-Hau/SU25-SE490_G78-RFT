package com.rft.rft_be.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rft.rft_be.entity.Booking;

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
            @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
    SELECT COUNT(b) > 0 FROM Booking b
    WHERE b.user.id = :userId
      AND (
        b.timeBookingStart < :end AND b.timeBookingEnd > :start
      )
      AND b.status IN ('PENDING', 'CONFIRMED')
""")
    boolean existsByUserIdAndTimeOverlap(
            @Param("userId") String userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    boolean existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(
            String userId,
            String vehicleId,
            LocalDateTime start,
            LocalDateTime end,
            List<Booking.Status> statusList
    );

    List<Booking> findByStatusAndCreatedAtBefore(Booking.Status status, LocalDateTime beforeTime);

    @Query("SELECT b FROM Booking b WHERE b.vehicle.user.id = :providerId ORDER BY b.createdAt DESC")
    List<Booking> findByProviderId(@Param("providerId") String providerId);

    @Query("SELECT b FROM Booking b WHERE b.vehicle.user.id = :providerId AND b.status = :status ORDER BY b.createdAt DESC")
    List<Booking> findByProviderIdAndStatus(@Param("providerId") String providerId, @Param("status") Booking.Status status);
}
