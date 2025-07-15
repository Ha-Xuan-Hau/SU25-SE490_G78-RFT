package com.rft.rft_be.repository;

import com.rft.rft_be.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, String> {
}