package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UsedCouponRepository extends JpaRepository<UsedCoupon, Integer> {
    boolean existsByUserIdAndCouponId(String userId, String couponId);
    @Modifying
    @Query("DELETE FROM UsedCoupon uc WHERE uc.coupon.id IN (SELECT c.id FROM Coupon c WHERE c.status = 'EXPIRED')")
    void deleteExpiredCouponUsage();
}
