package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.dto.coupon.CouponCreateDTO;
import com.rft.rft_be.dto.coupon.CouponUseDTO;
import com.rft.rft_be.service.admin.CouponService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CouponController.class)
public class CouponControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CouponService couponService;

    @Autowired
    private ObjectMapper objectMapper;

    private CouponDTO couponDTO;
    private CouponCreateDTO createDTO;

    private JwtAuthenticationToken jwtToken;
    @BeforeEach
    void setup() {
        couponDTO = new CouponDTO();
        couponDTO.setId("c1");
        couponDTO.setName("SAVE10");
        couponDTO.setDiscount(BigDecimal.TEN);
        couponDTO.setDescription("Giảm 10%");
        couponDTO.setTimeExpired(LocalDateTime.now().plusDays(10));

        createDTO = new CouponCreateDTO("SAVE10", BigDecimal.TEN, "Giảm 10%", LocalDateTime.now().plusDays(10));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testAssignToActiveUsers() throws Exception {
        mockMvc.perform(post("/api/coupons/admin/assign/c1").with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testCleanup() throws Exception {
        mockMvc.perform(post("/api/coupons/admin/cleanup").with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testRestoreCoupon() throws Exception {
        mockMvc.perform(put("/api/coupons/c1/restore").with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void testGetAllCoupons() throws Exception {
        when(couponService.getAllCoupons()).thenReturn(List.of(couponDTO));
        mockMvc.perform(get("/api/coupons"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void testGetCouponById() throws Exception {
        when(couponService.getCouponById("c1")).thenReturn(couponDTO);
        mockMvc.perform(get("/api/coupons/c1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testUpdateCoupon() throws Exception {
        when(couponService.updateCoupon(eq("c1"), any())).thenReturn(couponDTO);
        mockMvc.perform(put("/api/coupons/c1")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(couponDTO)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testCreateCoupon() throws Exception {
        when(couponService.createCoupon(any())).thenReturn(couponDTO);
        mockMvc.perform(post("/api/coupons/admin/create")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testDeleteCoupon() throws Exception {
        mockMvc.perform(delete("/api/coupons/c1").with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void testGetAvailableCouponsForUser() throws Exception {
        when(couponService.getValidCouponsForUser("user123"))
                .thenReturn(Collections.singletonList(new CouponUseDTO("c1", "SAVE10", BigDecimal.TEN, "Desc")));

        mockMvc.perform(get("/api/coupons/available?userId=user123"))
                .andExpect(status().isOk());
    }
    @Test
    @WithMockUser
    void testApplyCoupon_success() throws Exception {
        // Arrange
        CouponUseDTO mockDTO = new CouponUseDTO();
        mockDTO.setId("c1");
        mockDTO.setName("SAVE10");
        mockDTO.setDiscount(BigDecimal.TEN);
        mockDTO.setDescription("Desc");

        when(couponService.applyCoupon(eq("user123"), eq("SAVE10"))).thenReturn(mockDTO);

        // Act & Assert
        mockMvc.perform(get("/api/coupons/apply")
                        .param("code", "SAVE10")
                        .with(jwt().jwt(jwt -> jwt.claim("userId", "user123")))) // mock JWT
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("c1"))
                .andExpect(jsonPath("$.name").value("SAVE10"))
                .andExpect(jsonPath("$.discount").value(10))
                .andExpect(jsonPath("$.description").value("Desc"));
    }
    @Test
    @WithMockUser
    void testApplyCoupon_invalidCode() throws Exception {
        when(couponService.applyCoupon(eq("user123"), eq("INVALID")))
                .thenThrow(new RuntimeException("Coupon not found"));

        mockMvc.perform(get("/api/coupons/apply")
                        .param("code", "INVALID")
                        .with(jwt().jwt(jwt -> jwt.claim("userId", "user123"))))
                .andExpect(status().isBadRequest()) // <-- đúng với handler
                .andExpect(jsonPath("$.message").value("Coupon not found"));
    }
}
