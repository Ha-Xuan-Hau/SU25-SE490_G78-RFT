package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsedCouponRepository extends JpaRepository<UsedCoupon, Integer> {
    boolean existsByUserIdAndCouponId(String userId, String couponId);
}
