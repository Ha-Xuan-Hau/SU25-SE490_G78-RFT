package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponCreateDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.entity.Coupon;
import com.rft.rft_be.entity.UsedCoupon;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.CouponMapper;
import com.rft.rft_be.repository.CouponRepository;
import com.rft.rft_be.repository.UsedCouponRepository;
import com.rft.rft_be.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    UserRepository userRepository;

    @Override
    public void assignCouponToUser(String userId, String couponId) {
        if (!usedCouponRepository.existsByUserIdAndCouponId(userId, couponId)) {
            UsedCoupon usedCoupon = new UsedCoupon();
            usedCoupon.setId(UUID.randomUUID().toString());

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!!"));
            usedCoupon.setUser(user);

            Coupon coupon = couponRepository.findById(couponId)
                    .orElseThrow(() -> new RuntimeException("Không thấy mã giảm giá!!"));
            usedCoupon.setCoupon(coupon);

            usedCouponRepository.save(usedCoupon);
        }
    }

    @Override
    public void restoreCouponToValid(String id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không thấy mã giảm giá!!"));
        coupon.setStatus(Coupon.CouponStatus.VALID);
        couponRepository.save(coupon);

        usedCouponRepository.deleteByCouponId(id);
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
                .orElseThrow(() -> new RuntimeException("Không thấy mã giảm giá!!"));
    }

    @Override
    public CouponDTO updateCoupon(String id, CouponDTO dto) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không thấy mã giảm giá!!"));

        coupon.setName(dto.getName());
        coupon.setDiscount(dto.getDiscount());
        coupon.setDescription(dto.getDescription());
        coupon.setTimeExpired(dto.getTimeExpired());
        coupon.setUpdatedAt(LocalDateTime.now());
        coupon.setStatus(Coupon.CouponStatus.VALID);

        return couponMapper.toDTO(couponRepository.save(coupon));
    }

    @Override
    public void deleteCouponById(String id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không thấy mã giảm giá!!"));
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
    public void markCouponAsUsed(User user, Coupon coupon) {
        if (usedCouponRepository.existsByUserIdAndCouponId(user.getId(), coupon.getId())) return;

        UsedCoupon used = new UsedCoupon();
        used.setUser(user);
        used.setCoupon(coupon);

        usedCouponRepository.save(used);
    }

    @Override
    @Transactional
    public CouponUseDTO applyCoupon(String userId, String couponCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!!"));

        Coupon coupon = couponRepository.findByName(couponCode)
                .orElseThrow(() -> new RuntimeException("Không thấy mã giảm giá!!"));

        if (coupon.isExpired()) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (usedCouponRepository.existsByUserIdAndCouponId(user.getId(), coupon.getId())) {
            throw new RuntimeException("Bạn đã sử dụng mã giảm giá này rồi");
        }
        markCouponAsUsed(user, coupon);
        return new CouponUseDTO(
                coupon.getId(),
                coupon.getName(),
                coupon.getDiscount(),
                coupon.getDescription()
        );
    }

    @Override
    @Transactional
    public void checkAndExpireCoupons() {
        couponRepository.expireOutdatedCoupons();
        usedCouponRepository.deleteExpiredCouponUsage();
    }

    @Override
    @Transactional
    public void assignCouponToActiveUsers(String couponId) {
        for (String userId : userRepository.findAllActiveUserIds()) {
            assignCouponToUser(userId, couponId);
        }
    }

    @Override
    @Transactional
    public CouponDTO createCoupon(CouponCreateDTO dto) {
        Coupon coupon = new Coupon();
        coupon.setName(dto.getName());
        coupon.setDiscount(dto.getDiscount());
        coupon.setDescription(dto.getDescription());
        coupon.setTimeExpired(dto.getTimeExpired());
        coupon.setStatus(Coupon.CouponStatus.VALID);
        coupon.setCreatedAt(LocalDateTime.now());
        coupon.setUpdatedAt(LocalDateTime.now());

        Coupon saved = couponRepository.saveAndFlush(coupon);
        return couponMapper.toDTO(saved);
    }
}

