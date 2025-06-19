package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.mapper.CouponMapper;
import com.rft.rft_be.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CouponServiceImpl implements CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Override
    public List<CouponDTO> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(CouponMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CouponDTO getCouponById(String id) {
        return couponRepository.findById(id)
                .map(CouponMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    @Override
    public CouponDTO updateCoupon(String id, CouponDTO dto) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        coupon.setName(dto.getName());
        coupon.setDescription(dto.getDescription());
        coupon.setDiscount(dto.getDiscount());
        coupon.setTimeExpired(dto.getTimeExpired());
        coupon.setUpdatedAt(Instant.now()); //

        return CouponMapper.toDTO(couponRepository.save(coupon));
    }
    @Override
    public CouponDTO createCoupon(CouponDTO dto) {
        Coupon coupon = CouponMapper.toEntity(dto);
        coupon.setCreatedAt(Instant.now());
        coupon.setUpdatedAt(Instant.now());
        return CouponMapper.toDTO(couponRepository.save(coupon));
    }
    @Override
    public void deleteCouponById(String id) {
        if (!couponRepository.existsById(id)) {
            throw new RuntimeException("Coupon not found");
        }
        couponRepository.deleteById(id);
    }
}
