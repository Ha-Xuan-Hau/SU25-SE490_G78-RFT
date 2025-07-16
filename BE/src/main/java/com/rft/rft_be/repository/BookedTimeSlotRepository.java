package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookedTimeSlot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookedTimeSlotRepository extends JpaRepository<BookedTimeSlot, String> {

    List<BookedTimeSlot> findByVehicleIdAndTimeToAfter(String vehicleId, LocalDateTime now);
    @Modifying
    @Transactional
    @Query("DELETE FROM BookedTimeSlot b WHERE b.vehicle.id = :vehicleId AND b.timeFrom = :timeFrom AND b.timeTo = :timeTo")
    void deleteByVehicleIdAndTimeRange(
            @Param("vehicleId") String vehicleId,
            @Param("timeFrom") LocalDateTime timeFrom,
            @Param("timeTo") LocalDateTime timeTo
    );

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END "
            + "FROM BookedTimeSlot b "
            + "WHERE b.vehicle.id = :vehicleId "
            + "AND b.timeFrom < :endTime "
            + "AND b.timeTo > :startTime")
    boolean existsByVehicleIdAndTimeOverlap(
            @Param("vehicleId") String vehicleId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT b FROM BookedTimeSlot b WHERE b.vehicle.id = :vehicleId AND b.timeTo > :start AND b.timeFrom < :end")
    List<BookedTimeSlot> findByVehicleIdAndTimeRange(String vehicleId, LocalDateTime start, LocalDateTime end);
  //  @Query(value = "DELETE FROM booked_time_slots WHERE vehicle_id = :vehicleId", nativeQuery = true)
  //  void deleteByVehicleId(@Param("vehicleId") String vehicleId);

    @Query("SELECT COUNT(b) FROM BookedTimeSlot b WHERE b.id IN "
            + "(SELECT bt.id FROM BookedTimeSlot bt WHERE bt.id = :vehicleId)")
    long countByVehicleId(@Param("vehicleId") String vehicleId);



    List<BookedTimeSlot> findByTimeFromBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(b) > 0 FROM BookedTimeSlot b WHERE " +
            "((b.timeFrom <= :timeFrom AND b.timeTo > :timeFrom) " +
            "OR (b.timeFrom < :timeTo AND b.timeTo >= :timeTo) " +
            "OR (b.timeFrom >= :timeFrom AND b.timeTo <= :timeTo))")
    boolean existsConflictingBooking(@Param("timeFrom") LocalDateTime timeFrom,
                                     @Param("timeTo") LocalDateTime timeTo);

    @Query("SELECT DISTINCT b.vehicle.id FROM BookedTimeSlot b WHERE " +
            "b.timeFrom < :endTime AND b.timeTo > :startTime")
    List<String> findBusyVehicleIds(@Param("startTime") LocalDateTime start, @Param("endTime") LocalDateTime end);

    void deleteAllByTimeToBefore(LocalDateTime time);
   
}

