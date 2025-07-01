package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CouponService {
    void assignCouponToUser(String userId, String couponId);
    void restoreCouponToValid(String id);
    void markCouponAsUsed(String userId, String couponId);

    List<CouponDTO> getAllCoupons();
    CouponDTO getCouponById(String id);
    CouponDTO updateCoupon(String id, CouponDTO dto);
    CouponDTO createCoupon(CouponDTO dto);
    void deleteCouponById(String id);
    List<CouponUseDTO> getValidCouponsForUser(String userId);
}
