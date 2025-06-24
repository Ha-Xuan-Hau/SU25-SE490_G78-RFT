package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UsedCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedCouponRepository extends JpaRepository<UsedCoupon, String> {
}