package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookedTimeSlot;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookedTimeSlotRepository extends JpaRepository<BookedTimeSlot, String> {
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM booked_time_slots WHERE vehicle_id = :vehicleId", nativeQuery = true)
    void deleteByVehicleId(@Param("vehicleId") String vehicleId);
}