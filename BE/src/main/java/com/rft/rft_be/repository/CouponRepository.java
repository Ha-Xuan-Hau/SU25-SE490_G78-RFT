package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, String> {
}