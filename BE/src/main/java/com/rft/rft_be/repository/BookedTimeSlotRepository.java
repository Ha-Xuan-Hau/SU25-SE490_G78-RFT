package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookedTimeSlot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;import java.util.List;

public interface BookedTimeSlotRepository extends JpaRepository<BookedTimeSlot, String> {
    @Modifying
    @Transactional
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