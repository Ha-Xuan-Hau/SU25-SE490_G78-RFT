package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import org.mapstruct.Mapper;
import org.springframework.beans.BeanUtils;

@Mapper(componentModel = "spring")
public interface CouponMapper {
    public static CouponDTO toDTO(Coupon entity){
     CouponDTO dto = new CouponDTO();
     BeanUtils.copyProperties(entity, dto);
     return dto;
    }
    public static Coupon toEntity(CouponDTO dto){
        Coupon entity = new Coupon();
        BeanUtils.copyProperties(dto, entity);
        return entity;
    }

    CouponUseDTO toCouponUseDto(Coupon entity);

}
