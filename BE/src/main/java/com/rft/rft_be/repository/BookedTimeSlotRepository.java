package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookedTimeSlot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.time.LocalDateTime;

public interface BookedTimeSlotRepository extends JpaRepository<BookedTimeSlot, String> {
    @Modifying
    @Transactional
    @Query("DELETE FROM BookedTimeSlot b WHERE b.vehicle.id = :vehicleId AND b.timeFrom = :timeFrom AND b.timeTo = :timeTo")
    void deleteByVehicleIdAndTimeRange(
            @Param("vehicleId") String vehicleId,
            @Param("timeFrom") Instant timeFrom,
            @Param("timeTo") Instant timeTo
    );

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END " +
            "FROM BookedTimeSlot b " +
            "WHERE b.vehicle.id = :vehicleId " +
            "AND b.timeFrom < :endTime " +
            "AND b.timeTo > :startTime")
    boolean existsByVehicleIdAndTimeOverlap(
            @Param("vehicleId") String vehicleId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime);

    @Query("SELECT b FROM BookedTimeSlot b WHERE b.vehicle.id = :vehicleId AND b.timeTo > :start AND b.timeFrom < :end")
    List<BookedTimeSlot> findByVehicleIdAndTimeRange(String vehicleId, Instant start, Instant end);
    @Query(value = "DELETE FROM booked_time_slots WHERE vehicle_id = :vehicleId", nativeQuery = true)
    void deleteByVehicleId(@Param("vehicleId") String vehicleId);

    @Query("SELECT COUNT(b) FROM BookedTimeSlot b WHERE b.id IN " +
            "(SELECT bt.id FROM BookedTimeSlot bt WHERE bt.id = :vehicleId)")
    long countByVehicleId(@Param("vehicleId") String vehicleId);



    List<BookedTimeSlot> findByTimeFromBetween(Instant start, Instant end);

    @Query("SELECT COUNT(b) > 0 FROM BookedTimeSlot b WHERE " +
            "((b.timeFrom <= :timeFrom AND b.timeTo > :timeFrom) " +
            "OR (b.timeFrom < :timeTo AND b.timeTo >= :timeTo) " +
            "OR (b.timeFrom >= :timeFrom AND b.timeTo <= :timeTo))")
    boolean existsConflictingBooking(@Param("timeFrom") Instant timeFrom,
                                     @Param("timeTo") Instant timeTo);
}