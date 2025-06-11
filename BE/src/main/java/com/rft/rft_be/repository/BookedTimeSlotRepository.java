package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.BookedTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookedTimeSlotRepository extends JpaRepository<BookedTimeSlot, String> {
}