package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.CouponMapper;
import com.rft.rft_be.repository.CouponRepository;
import com.rft.rft_be.repository.UsedCouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CouponServiceImpl implements CouponService {

    @Override
    public void restoreCouponToValid(String id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setStatus(Coupon.CouponStatus.VALID);
        couponRepository.save(coupon);
    }
    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private UsedCouponRepository usedCouponRepository;
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
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setStatus(Coupon.CouponStatus.EXPIRED);
        couponRepository.save(coupon);
    }
    @Override
    public List<CouponDTO> getValidCouponsForUser(String userId) {
        Instant now = Instant.now();
        return couponRepository.findAll().stream()
                .filter(c -> c.getStatus().equals("VALID") &&
                        c.getTimeExpired() != null &&
                        c.getTimeExpired().atZone(ZoneId.systemDefault()).toInstant().isAfter(now)
                        &&
                        !usedCouponRepository.existsByUserIdAndCouponId(userId, c.getId()))
                .map(CouponMapper::toDTO)
                .collect(Collectors.toList());
    }
    public void markCouponAsUsed(String userId, String couponId) {
        if (!usedCouponRepository.existsByUserIdAndCouponId(userId, couponId)) {
            UsedCoupon used = new UsedCoupon();
            User user = new User();
            user.setId(userId);
            used.setUser(user);
            Coupon coupon = new Coupon();
            coupon.setId(couponId);
            used.setCoupon(coupon);
            used.setId(UUID.randomUUID().toString());
            usedCouponRepository.save(used);
        }
    }
}
