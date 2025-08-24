package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Coupon;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface CouponRepository extends JpaRepository<Coupon, String> {
    Optional<Coupon> findByName(String name);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.status = 'EXPIRED' WHERE c.timeExpired < CURRENT_TIMESTAMP AND c.status = 'VALID'")
    void expireOutdatedCoupons();

    long countByStatus(Coupon.CouponStatus status);

    // Optional – dùng cho lọc theo thời gian tạo (dashboard filter)
    List<Coupon> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, String id);
}