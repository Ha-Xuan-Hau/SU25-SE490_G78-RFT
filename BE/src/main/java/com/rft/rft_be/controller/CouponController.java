package com.rft.rft_be.controller;


import com.rft.rft_be.dto.admin.CouponDTO;
import com.rft.rft_be.repository.CouponRepository;
import com.rft.rft_be.service.admin.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {
@Autowired
private CouponService couponService;
@GetMapping
    public ResponseEntity<List<CouponDTO>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
}
@GetMapping("/{id}")
    public ResponseEntity<CouponDTO> getCouponById(@PathVariable String id) {
    return ResponseEntity.ok(couponService.getCouponById(id));
}
    @PutMapping("/{id}")
    public ResponseEntity<CouponDTO> update(@PathVariable String id, @RequestBody CouponDTO dto) {
        return ResponseEntity.ok(couponService.updateCoupon(id, dto));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        couponService.deleteCouponById(id);
        return ResponseEntity.noContent().build();
    }
}
