package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.admin.AdminUpdateVehicleStatusDTO;
import com.rft.rft_be.service.admin.AdminVehicleApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/vehicles")
@RequiredArgsConstructor
public class AdminVehicleApprovalController {

    private final AdminVehicleApprovalService adminVehicleApprovalService;

    // 1. Lấy danh sách xe chờ duyệt (PENDING)
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingVehicles(@RequestParam Optional<String> type, @RequestParam Optional<String> sortBy, @RequestParam Optional<String> direction, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {

        Page<VehicleGetDTO> pendingVehicles = adminVehicleApprovalService.getPendingVehicles(type, sortBy, direction, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("content", pendingVehicles.getContent());
        response.put("currentPage", pendingVehicles.getNumber());
        response.put("totalItems", pendingVehicles.getTotalElements());
        response.put("totalPages", pendingVehicles.getTotalPages());

        return ResponseEntity.ok(response);
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

    // 5. Duyệt hoặc Từ chối nhiều xe cùng lúc
    @PutMapping("/status/batch")
    public ResponseEntity<?> updateVehicleStatuses(@RequestBody @Valid List<AdminUpdateVehicleStatusDTO> requests) {
        adminVehicleApprovalService.updateMultipleVehicleStatuses(requests);
        return ResponseEntity.ok().build();
    }
}