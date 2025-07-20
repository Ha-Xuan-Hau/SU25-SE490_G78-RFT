package com.rft.rft_be.mapper;


import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CouponMapper {
    @Mapping(source = "status", target = "status")
    CouponDTO toDTO(Coupon entity);
    @Mapping(source = "status", target = "status")
    Coupon toEntity(CouponDTO dto);
    CouponUseDTO toCouponUseDto(Coupon entity);
}
