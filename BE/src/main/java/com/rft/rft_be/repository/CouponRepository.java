package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Coupon;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface CouponRepository extends JpaRepository<Coupon, String> {
    Optional<Coupon> findByName(String name);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.status = 'EXPIRED' WHERE c.timeExpired < CURRENT_TIMESTAMP AND c.status = 'VALID'")
    void expireOutdatedCoupons();
}