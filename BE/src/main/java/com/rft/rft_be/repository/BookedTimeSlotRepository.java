package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookedTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookedTimeSlotRepository extends JpaRepository<BookedTimeSlot, String> {
}