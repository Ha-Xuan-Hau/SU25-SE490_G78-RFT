package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.Booking.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, String> {

    @Query("""
        SELECT DISTINCT b FROM Booking b
        JOIN FETCH b.user u
        JOIN FETCH b.bookingDetails bd
        JOIN FETCH bd.vehicle v
        JOIN FETCH v.user vu
    """)
    List<Booking> findAllWithUserAndVehicle();

    @Query("""
        SELECT DISTINCT b FROM Booking b
        JOIN FETCH b.user u
        JOIN FETCH b.bookingDetails bd
        JOIN FETCH bd.vehicle v
        JOIN FETCH v.user vu
        WHERE b.id = :bookingId
    """)
    Optional<Booking> findByIdWithUserAndVehicle(@Param("bookingId") String bookingId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :userId
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findByUserId(@Param("userId") String userId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :userId AND b.status = :status
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") Booking.Status status);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = :status
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findByStatus(@Param("status") Booking.Status status);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.user.id = :userId AND b.timeBookingStart BETWEEN :startDate AND :endDate
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findByUserIdAndTimeBookingStartBetween(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT DISTINCT b FROM Booking b
        JOIN FETCH b.user u
        JOIN FETCH b.bookingDetails bd
        JOIN FETCH bd.vehicle v
        JOIN FETCH v.user vu
        WHERE b.codeTransaction = :codeTransaction
    """)
    Optional<Booking> findByCodeTransaction(@Param("codeTransaction") String codeTransaction);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.user.id = :userId
          AND (b.timeBookingStart < :end AND b.timeBookingEnd > :start)
          AND b.status IN ('PENDING', 'CONFIRMED')
    """)
    boolean existsByUserIdAndTimeOverlap(
            @Param("userId") String userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    List<Booking> findByStatusAndCreatedAtBefore(Booking.Status status, LocalDateTime beforeTime);

    @Query("""
        SELECT DISTINCT b FROM Booking b
        JOIN b.bookingDetails bd
        JOIN bd.vehicle v
        JOIN v.user u
        WHERE u.id = :providerId
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findByProviderId(@Param("providerId") String providerId);

    @Query(
            value = """
            SELECT DISTINCT b FROM Booking b
            JOIN b.bookingDetails bd
            JOIN bd.vehicle v
            JOIN v.user u
            WHERE u.id = :providerId AND b.status = :status
            ORDER BY COALESCE(b.updatedAt, b.createdAt) DESC
        """,
            countQuery = """
            SELECT COUNT(DISTINCT b) FROM Booking b
            JOIN b.bookingDetails bd
            JOIN bd.vehicle v
            JOIN v.user u
            WHERE u.id = :providerId AND b.status = :status
        """
    )
    Page<Booking> findByProviderIdAndStatus(
            @Param("providerId") String providerId,
            @Param("status") Booking.Status status,
            Pageable pageable
    );


    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        JOIN b.bookingDetails bd
        WHERE b.user.id = :userId
          AND bd.vehicle.id = :vehicleId
          AND b.timeBookingStart = :timeBookingStart
          AND b.timeBookingEnd = :timeBookingEnd
          AND b.status IN :statusList
    """)
    boolean existsBookingForUserAndVehicleAndTimeRange(
            @Param("userId") String userId,
            @Param("vehicleId") String vehicleId,
            @Param("timeBookingStart") LocalDateTime timeBookingStart,
            @Param("timeBookingEnd") LocalDateTime timeBookingEnd,
            @Param("statusList") List<Booking.Status> statusList
    );

    // Admin methods
    Long countByUserId(String userId);

    Long countByUserIdAndStatus(String userId, Booking.Status status);



    @Query("""
    select count(b) from Booking b
    where b.user.id = :userId
      and b.status <> :completed
      and b.status <> :cancelled
""")
    long countUnfinishedByUserId(@Param("userId") String userId,
                                 @Param("completed") Booking.Status completed,
                                 @Param("cancelled") Booking.Status cancelled);


  @Query("""
      SELECT COUNT(b) > 0 FROM Booking b
      JOIN b.bookingDetails bd
      WHERE bd.vehicle.id = :vehicleId
        AND b.timeBookingEnd > :now
        AND b.status IN ('UNPAID','PENDING','CONFIRMED','DELIVERED','RECEIVED_BY_CUSTOMER')
      """)
  boolean existsActiveOrFutureByVehicleId(
          @Param("vehicleId") String vehicleId,
          @Param("now") LocalDateTime now
  );

    @Query("""
           SELECT COUNT(b) FROM Booking b
           WHERE b.createdAt >= :start AND b.createdAt < :end
           """)
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("""
           SELECT COUNT(b) FROM Booking b
           WHERE b.status = :status
             AND b.createdAt >= :start AND b.createdAt < :end
           """)
    long countByStatusAndCreatedAtBetween(Status status, LocalDateTime start, LocalDateTime end);

    @Query("""
           SELECT COUNT(b) FROM Booking b
           WHERE b.status IN :statuses
             AND b.createdAt >= :start AND b.createdAt < :end
           """)
    long countByStatusInAndCreatedAtBetween(List<Status> statuses, LocalDateTime start, LocalDateTime end);

    // Thời gian thuê trung bình (ngày) cho booking COMPLETED trong tháng có time_booking_end
    // MySQL native để dùng TIMESTAMPDIFF(DAY, start, end)
    @Query(value = """
       SELECT AVG(TIMESTAMPDIFF(HOUR, b.time_booking_start, b.time_booking_end))
       FROM bookings b
       WHERE b.status = 'COMPLETED'
         AND b.time_booking_end >= :start AND b.time_booking_end < :end
       """, nativeQuery = true)
    Double avgRentalHoursCompletedByEndBetween(LocalDateTime start, LocalDateTime end);
    @Query("""
    SELECT DISTINCT b FROM Booking b
    JOIN b.bookingDetails bd
    JOIN bd.vehicle v
    JOIN v.user u
    WHERE u.id = :providerId
      AND b.timeBookingStart >= :start AND b.timeBookingStart < :end
    ORDER BY b.timeBookingStart ASC
""")
    List<Booking> findByProviderIdAndStartBetween(@Param("providerId") String providerId,
                                                  @Param("start") LocalDateTime start,
                                                  @Param("end") LocalDateTime end);

    @Query("""
    SELECT DISTINCT b FROM Booking b
    JOIN b.bookingDetails bd
    JOIN bd.vehicle v
    JOIN v.user u
    WHERE u.id = :providerId
      AND b.timeBookingEnd >= :start AND b.timeBookingEnd < :end
    ORDER BY b.timeBookingEnd ASC
""")
    List<Booking> findByProviderIdAndEndBetween(@Param("providerId") String providerId,
                                                @Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end);

    @Query("""
    SELECT DISTINCT b FROM Booking b
    JOIN b.bookingDetails bd
    JOIN bd.vehicle v
    JOIN v.user u
    WHERE u.id = :providerId
      AND b.status = 'CANCELLED'
      AND b.updatedAt >= :start AND b.updatedAt < :end
    ORDER BY b.updatedAt DESC
""")
    List<Booking> findCancelledByProviderIdAndUpdatedAtBetween(@Param("providerId") String providerId,
                                                               @Param("start") LocalDateTime start,
                                                               @Param("end") LocalDateTime end);

    @Query("""
    SELECT DISTINCT b FROM Booking b
    JOIN b.bookingDetails bd
    JOIN bd.vehicle v
    JOIN v.user u
    WHERE u.id = :providerId
      AND (
            (b.timeBookingStart >= :start AND b.timeBookingStart < :end)
         OR (b.timeBookingEnd   >= :start AND b.timeBookingEnd   < :end)
         OR (b.updatedAt        >= :start AND b.updatedAt        < :end)
      )
    ORDER BY COALESCE(b.updatedAt, b.createdAt) DESC
""")
    List<Booking> findProviderBookingsTouchedToday(@Param("providerId") String providerId,
                                                   @Param("start") LocalDateTime start,
                                                   @Param("end") LocalDateTime end);
}
