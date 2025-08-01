package com.rft.rft_be.service;

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
import com.rft.rft_be.service.admin.CouponServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CouponServiceTest {

    @Mock
    CouponRepository couponRepository;
    @Mock
    UsedCouponRepository usedCouponRepository;
    @Mock
    CouponMapper couponMapper;
    @Mock
    UserRepository userRepository;

    @InjectMocks
    CouponServiceImpl couponService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void assignCouponToUser_shouldAssign() {
        when(usedCouponRepository.existsByUserIdAndCouponId("u1", "c1")).thenReturn(false);
        User user = new User(); user.setId("u1");
        Coupon coupon = new Coupon(); coupon.setId("c1");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(couponRepository.findById("c1")).thenReturn(Optional.of(coupon));

        couponService.assignCouponToUser("u1", "c1");
        verify(usedCouponRepository).save(any(UsedCoupon.class));
    }

    @Test
    void assignCouponToUser_shouldSkipIfExists() {
        when(usedCouponRepository.existsByUserIdAndCouponId("u1", "c1")).thenReturn(true);
        couponService.assignCouponToUser("u1", "c1");
        verify(usedCouponRepository, never()).save(any());
    }

    @Test
    void applyCoupon_shouldThrowIfExpired() {
        User user = new User(); user.setId("u1");
        Coupon coupon = new Coupon(); coupon.setTimeExpired(LocalDateTime.now().minusDays(1));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(couponRepository.findByName("code")).thenReturn(Optional.of(coupon));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> couponService.applyCoupon("u1", "code"));
        assertEquals("Mã giảm giá đã hết hạn", ex.getMessage());
    }

    @Test
    void applyCoupon_shouldThrowIfAlreadyUsed() {
        User user = new User(); user.setId("u1");
        Coupon coupon = new Coupon();
        coupon.setId("c1"); coupon.setTimeExpired(LocalDateTime.now().plusDays(1));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(couponRepository.findByName("code")).thenReturn(Optional.of(coupon));
        when(usedCouponRepository.existsByUserIdAndCouponId("u1", "c1")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> couponService.applyCoupon("u1", "code"));
        assertEquals("Bạn đã sử dụng mã giảm giá này rồi", ex.getMessage());
    }

    @Test
    void restoreCouponToValid_shouldSetStatusToValid() {
        Coupon coupon = new Coupon();
        when(couponRepository.findById("c1")).thenReturn(Optional.of(coupon));

        couponService.restoreCouponToValid("c1");
        assertEquals(Coupon.CouponStatus.VALID, coupon.getStatus());
        verify(couponRepository).save(coupon);
    }

    @Test
    void getAllCoupons_shouldReturnDTOList() {
        Coupon c = new Coupon(); List<Coupon> list = List.of(c);
        CouponDTO dto = new CouponDTO();
        when(couponRepository.findAll()).thenReturn(list);
        when(couponMapper.toDTO(c)).thenReturn(dto);

        List<CouponDTO> result = couponService.getAllCoupons();
        assertEquals(1, result.size());
    }

    @Test
    void getCouponById_shouldReturnDto() {
        Coupon coupon = new Coupon();
        CouponDTO dto = new CouponDTO();
        when(couponRepository.findById("c1")).thenReturn(Optional.of(coupon));
        when(couponMapper.toDTO(coupon)).thenReturn(dto);

        assertEquals(dto, couponService.getCouponById("c1"));
    }

    @Test
    void updateCoupon_shouldUpdate() {
        Coupon coupon = new Coupon();
        CouponDTO dto = new CouponDTO();
        dto.setName("name"); dto.setDiscount(BigDecimal.ONE);
        dto.setDescription("desc"); dto.setTimeExpired(LocalDateTime.now());

        when(couponRepository.findById("c1")).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any())).thenReturn(coupon);
        when(couponMapper.toDTO(coupon)).thenReturn(dto);

        assertEquals(dto, couponService.updateCoupon("c1", dto));
    }

    @Test
    void deleteCouponById_shouldExpire() {
        Coupon coupon = new Coupon();
        when(couponRepository.findById("c1")).thenReturn(Optional.of(coupon));

        couponService.deleteCouponById("c1");
        assertEquals(Coupon.CouponStatus.EXPIRED, coupon.getStatus());
        verify(couponRepository).save(coupon);
    }

    @Test
    void getValidCouponsForUser_shouldReturnValid() {
        Coupon coupon = new Coupon();
        coupon.setStatus(Coupon.CouponStatus.VALID);
        coupon.setTimeExpired(LocalDateTime.now().plusDays(1));
        coupon.setId("c1");

        when(couponRepository.findAll()).thenReturn(List.of(coupon));
        when(usedCouponRepository.existsByUserIdAndCouponId("u1", "c1")).thenReturn(false);
        when(couponMapper.toCouponUseDto(coupon)).thenReturn(new CouponUseDTO("c1", "name", BigDecimal.ONE, "desc"));

        List<CouponUseDTO> result = couponService.getValidCouponsForUser("u1");
        assertEquals(1, result.size());
    }

    @Test
    void applyCoupon_shouldReturnCouponUseDTO() {
        User user = new User(); user.setId("u1");
        Coupon coupon = new Coupon();
        coupon.setId("c1"); coupon.setName("code");
        coupon.setDiscount(BigDecimal.ONE);
        coupon.setDescription("desc");
        coupon.setTimeExpired(LocalDateTime.now().plusDays(1));

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(couponRepository.findByName("code")).thenReturn(Optional.of(coupon));
        when(usedCouponRepository.existsByUserIdAndCouponId("u1", "c1")).thenReturn(false);

        CouponUseDTO result = couponService.applyCoupon("u1", "code");
        assertEquals("c1", result.getId());
    }

    @Test
    void checkAndExpireCoupons_shouldCallRepoMethods() {
        couponService.checkAndExpireCoupons();
        verify(couponRepository).expireOutdatedCoupons();
        verify(usedCouponRepository).deleteExpiredCouponUsage();
    }

    @Test
    void assignCouponToActiveUsers_shouldAssignToAll() {
        when(userRepository.findAllActiveUserIds()).thenReturn(List.of("u1", "u2"));
        when(usedCouponRepository.existsByUserIdAndCouponId(any(), any())).thenReturn(true);

        couponService.assignCouponToActiveUsers("c1");
        verify(userRepository).findAllActiveUserIds();
    }

    @Test
    void createCoupon_shouldReturnSavedCouponDTO() {
        CouponCreateDTO dto = new CouponCreateDTO("name", BigDecimal.TEN, "desc", LocalDateTime.now().plusDays(2));
        Coupon saved = new Coupon(); saved.setId("c1");
        when(couponRepository.saveAndFlush(any())).thenReturn(saved);
        CouponDTO expected = new CouponDTO(); expected.setId("c1");
        when(couponMapper.toDTO(saved)).thenReturn(expected);

        CouponDTO result = couponService.createCoupon(dto);
        assertEquals("c1", result.getId());
    }
}

