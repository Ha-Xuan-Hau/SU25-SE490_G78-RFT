package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, String> {
}