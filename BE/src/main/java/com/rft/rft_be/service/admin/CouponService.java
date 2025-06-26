package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CouponService {
    void restoreCouponToValid(String id);

    List<CouponDTO> getAllCoupons();
    CouponDTO getCouponById(@Param("id") String id);
    CouponDTO updateCoupon(@Param("id") String id, @Param("dto")  CouponDTO dto );
    CouponDTO createCoupon(@Param("dto")  CouponDTO dto);
    void deleteCouponById(@Param("id") String id);

    List<CouponUseDTO> getValidCouponsForUser(String userId);
}
