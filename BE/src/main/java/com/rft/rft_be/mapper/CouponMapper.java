package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.admin.UsedCouponDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.UsedCoupon;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface CouponMapper {

    // Map from Coupon entity to CouponDTO
    CouponDTO toDTO(Coupon entity);

    // Map from CouponDTO to Coupon entity
    Coupon toEntity(CouponDTO dto);

    // Map from Coupon entity to custom use-specific DTO
    CouponUseDTO toCouponUseDto(Coupon entity);

    // Map UsedCoupon entity to its DTO
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "coupon.id", target = "couponId")
    UsedCouponDTO toDTO(UsedCoupon entity);

    // Map DTO back to UsedCoupon entity
    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "couponId", target = "coupon.id")
    UsedCoupon toEntity(UsedCouponDTO dto);
}
