package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponCreateDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.User;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CouponService {
    void assignCouponToUser(String userId, String couponId);
    void restoreCouponToValid(String id);
    void markCouponAsUsed(User user, Coupon coupon);

    List<CouponDTO> getAllCoupons();
    CouponDTO getCouponById(String id);
    CouponDTO updateCoupon(String id, CouponDTO dto);
    void deleteCouponById(String id);
    List<CouponUseDTO> getValidCouponsForUser(String userId);
    CouponUseDTO applyCoupon(String userId, String couponCode);

    void checkAndExpireCoupons();

    void assignCouponToActiveUsers(String couponId);

    CouponDTO createCoupon(CouponCreateDTO dto);
}
