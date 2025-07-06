package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.CouponMapper;
import com.rft.rft_be.repository.CouponRepository;
import com.rft.rft_be.repository.UsedCouponRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Service
public class CouponServiceImpl implements CouponService {

    CouponRepository couponRepository;
    UsedCouponRepository usedCouponRepository;
    CouponMapper couponMapper;

    @Override
    public void assignCouponToUser(String userId, String couponId) {
        UsedCoupon usedCoupon = new UsedCoupon();
        usedCoupon.setId(UUID.randomUUID().toString());
        User user = new User();
        user.setId(userId);
        usedCoupon.setUser(user);
        Coupon coupon = new Coupon();
        coupon.setId(couponId);
        usedCoupon.setCoupon(coupon);
        usedCouponRepository.save(usedCoupon);
    }

    @Override
    public void restoreCouponToValid(String id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setStatus(Coupon.CouponStatus.VALID);
        couponRepository.save(coupon);
    }

    @Override
    public List<CouponDTO> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(couponMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CouponDTO getCouponById(String id) {
        return couponRepository.findById(id)
                .map(couponMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    @Override
    public CouponDTO updateCoupon(String id, CouponDTO dto) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        coupon.setName(dto.getName());
        coupon.setDiscount(dto.getDiscount());
        coupon.setDescription(dto.getDescription());
        coupon.setTimeExpired(dto.getTimeExpired());
        coupon.setUpdatedAt(LocalDateTime.now());
        coupon.setStatus(Coupon.CouponStatus.VALID);

        return couponMapper.toDTO(couponRepository.save(coupon));
    }

    @Override
    public CouponDTO createCoupon(CouponDTO dto) {
        Coupon coupon = couponMapper.toEntity(dto);
        coupon.setCreatedAt(LocalDateTime.now());
        coupon.setUpdatedAt(LocalDateTime.now());
        return couponMapper.toDTO(couponRepository.save(coupon));
    }

    @Override
    public void deleteCouponById(String id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        coupon.setStatus(Coupon.CouponStatus.EXPIRED);
        couponRepository.save(coupon);
    }

    @Override
    public List<CouponUseDTO> getValidCouponsForUser(String userId) {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findAll().stream()
                .filter(c -> c.getStatus() == Coupon.CouponStatus.VALID &&
                        c.getTimeExpired() != null &&
                        c.getTimeExpired().atZone(ZoneId.systemDefault()).toLocalDateTime().isAfter(now) &&
                        !usedCouponRepository.existsByUserIdAndCouponId(userId, c.getId()))
                .map(couponMapper::toCouponUseDto)
                .collect(Collectors.toList());
    }

    @Override
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
