package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

@Repository
public interface UsedCouponRepository extends JpaRepository<UsedCoupon, Integer> {
    boolean existsByUserIdAndCouponId(String userId, String couponId);
    @Modifying
    @Query("DELETE FROM UsedCoupon uc WHERE uc.coupon.id IN (SELECT c.id FROM Coupon c WHERE c.status = 'EXPIRED')")
    void deleteExpiredCouponUsage();
    @Modifying
    @Transactional
    @Query("DELETE FROM UsedCoupon uc WHERE uc.coupon.id = :couponId")
    void deleteByCouponId(@Param("couponId") String couponId);

}
