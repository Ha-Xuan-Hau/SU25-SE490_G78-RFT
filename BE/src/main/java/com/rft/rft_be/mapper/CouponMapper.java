package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.entity.Coupon;
import org.springframework.beans.BeanUtils;

import javax.swing.text.html.parser.Entity;

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
}
