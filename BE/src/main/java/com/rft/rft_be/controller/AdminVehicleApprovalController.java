package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.admin.AdminUpdateVehicleStatusDTO;
import com.rft.rft_be.service.admin.AdminVehicleApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin/vehicles")
@RequiredArgsConstructor
public class AdminVehicleApprovalController {

    private final AdminVehicleApprovalService adminVehicleApprovalService;

    // 1. Lấy danh sách xe chờ duyệt (PENDING)
    @GetMapping("/pending")
    public Page<VehicleGetDTO> getPendingVehicles(@RequestParam Optional<String> type, @RequestParam Optional<String> sortBy, @RequestParam Optional<String> direction, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return adminVehicleApprovalService.getPendingVehicles(type, sortBy, direction, page, size);
    }

    // 2. Thống kê tổng số xe PENDING theo từng types
    @GetMapping("/pending/stats")
    public ResponseEntity<?> getPendingStats() {
        return ResponseEntity.ok(adminVehicleApprovalService.getPendingStats());
    }

    // 3. Xem chi tiết xe
    @GetMapping("/{vehicleId}")
    public ResponseEntity<VehicleGetDTO> getVehicleDetail(@PathVariable String vehicleId) {
        return ResponseEntity.ok(adminVehicleApprovalService.getVehicleDetail(vehicleId));
    }

    // 4. Duyệt hoặc Từ chối
    @PutMapping("/{vehicleId}/status")
    public ResponseEntity<?> updateVehicleStatus(@PathVariable String vehicleId, @RequestBody @Valid AdminUpdateVehicleStatusDTO request) {
        adminVehicleApprovalService.updateVehicleStatus(vehicleId, request);
        return ResponseEntity.ok().build();
    }
}