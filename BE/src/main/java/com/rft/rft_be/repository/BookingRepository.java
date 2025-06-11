package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, String> {
}