package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookedTimeSlot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

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
}