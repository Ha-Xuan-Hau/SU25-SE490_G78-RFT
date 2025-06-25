package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.admin.UsedCouponDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;

public interface UsedCouponMapper {
    public static UsedCouponDTO toDTO(UsedCoupon entity) {
        return new UsedCouponDTO(
                entity.getId(),
                entity.getUser().getId(),
                entity.getCoupon().getId()
        );
    }

    public static UsedCoupon toEntity(UsedCouponDTO dto) {
        UsedCoupon entity = new UsedCoupon();

        User user = new User();
        user.setId(dto.getUserId());
        entity.setUser(user);

        Coupon coupon = new Coupon();
        coupon.setId(dto.getCouponId());
        entity.setCoupon(coupon);

        return entity;
    }
}



