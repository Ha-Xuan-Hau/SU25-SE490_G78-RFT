package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.admin.CouponDashboardResponse;
import com.rft.rft_be.dto.admin.CouponItemDTO;
import com.rft.rft_be.dto.admin.CouponSummaryDTO;
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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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

    @Override
    public CouponDashboardResponse getCouponDashboard(LocalDate from, LocalDate to) {
        // 1) Lấy list theo filter thời gian (nếu có)
        List<Coupon> coupons;
        if (from != null || to != null) {
            LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDate.MIN.atStartOfDay();
            LocalDateTime toDt   = (to != null)   ? to.atTime(23,59,59) : LocalDate.MAX.atTime(23,59,59);
            coupons = couponRepository.findByCreatedAtBetween(fromDt, toDt);
        } else {
            coupons = couponRepository.findAll();
        }

        // 2) Tính summary (đếm trên toàn tập đã lọc)
        long active = coupons.stream().filter(c -> c.getStatus() == Coupon.CouponStatus.VALID).count();
        long expired = coupons.stream().filter(c -> c.getStatus() == Coupon.CouponStatus.EXPIRED).count();

        CouponSummaryDTO summary = CouponSummaryDTO.builder()
                .activeCount(active)
                .expiredCount(expired)
                .totalCount(active + expired)
                .build();

        // 3) Map list cho UI + daysLeft
        LocalDateTime now = LocalDateTime.now();
        List<CouponItemDTO> items = coupons.stream()
                .sorted(
                        Comparator
                                // VALID trước, EXPIRED sau
                                .comparing((Coupon c) -> c.getStatus() != Coupon.CouponStatus.VALID)
                                // cùng nhóm thì createdAt DESC (mới nhất lên đầu)
                                .thenComparing(Coupon::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                )
                .map(c -> {
                    Long daysLeft = null;
                    if (c.getStatus() == Coupon.CouponStatus.VALID && c.getTimeExpired() != null) {
                        long diff = Duration.between(now, c.getTimeExpired()).toDays();
                        daysLeft = Math.max(diff, 0); // không âm
                    }
                    return CouponItemDTO.builder()
                            .id(c.getId())
                            .name(c.getName())
                            .discount(c.getDiscount())
                            .description(c.getDescription())
                            .timeExpired(c.getTimeExpired())
                            .status(c.getStatus().name())
                            .daysLeft(daysLeft)
                            .build();
                })
                // tùy UI: sort VALID trước, rồi theo ngày hết hạn gần nhất
                .sorted(Comparator
                        .comparing(CouponItemDTO::getStatus, Comparator.comparing(s -> !"VALID".equals(s))) // VALID lên đầu
                        .thenComparing(dto -> Optional.ofNullable(dto.getTimeExpired()).orElse(LocalDateTime.MAX))
                )
                .toList();

        return CouponDashboardResponse.builder()
                .summary(summary)
                .items(items)
                .build();
    }
}

