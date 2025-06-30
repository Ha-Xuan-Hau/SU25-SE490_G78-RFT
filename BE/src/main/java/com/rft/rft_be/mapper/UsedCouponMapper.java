package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.admin.UsedCouponDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UsedCouponMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "coupon.id", target = "couponId")
    UsedCouponDTO toDTO(UsedCoupon entity);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "couponId", target = "coupon.id")
    UsedCoupon toEntity(UsedCouponDTO dto);
}



