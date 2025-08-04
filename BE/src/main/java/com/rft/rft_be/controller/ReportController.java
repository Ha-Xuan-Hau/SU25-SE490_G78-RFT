package com.rft.rft_be.controller;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepo;

    /**
     * API tạo mới một báo cáo.
     * Người dùng hiện tại (reporter) được tự động gán từ @AuthenticationPrincipal.
     */
    @PostMapping
    public ResponseEntity<Void> createReport(@RequestBody ReportRequest request) {
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getToken().getClaim("userId");

        User reporter = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        reportService.report(reporter, request);
        return ResponseEntity.ok().build();
    }

    /**
     * API lấy danh sách báo cáo theo loại tổng quát (generalType) như:
     * SERIOUS_ERROR, NON_SERIOUS_ERROR, STAFF_ERROR.
     * Kết quả được phân trang.
     */
    @GetMapping
    public ResponseEntity<List<ReportGroupedByTargetDTO>> getReportsByType(@RequestParam String type,
                                                                           @RequestParam(defaultValue = "0") int page,
                                                                           @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.getReportsByType(type, page, size));
    }
    /**
     * API tìm kiếm báo cáo theo từ khóa (keyword), loại lỗi cụ thể (type)
     * và loại lỗi tổng quát (generalType). Có hỗ trợ phân trang.
     */
    @GetMapping("/search")
    public ResponseEntity<List<ReportGroupedByTargetDTO>> searchReports(@RequestParam String generalType,
                                                                        @RequestParam(required = false) String keyword,
                                                                        @RequestParam(required = false) String type,
                                                                        @RequestParam(defaultValue = "0") int page,
                                                                        @RequestParam(defaultValue = "10") int size){
        return ResponseEntity.ok(reportService.searchReports(generalType, keyword, type, page, size));
    }
    /**
     * API lấy chi tiết báo cáo theo ID của người/xe bị báo cáo.
     */
    @GetMapping("/detail/{targetId}")
    public ResponseEntity<ReportDetailDTO> getReportDetail(
            @PathVariable String targetId,
            @RequestParam String type
    ) {
        return ResponseEntity.ok(reportService.getReportDetailByTargetAndType(targetId, type));
    }
    @PostMapping("/staff")
    public ResponseEntity<Void> createReportByStaff(@RequestBody ReportRequest request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String role = authentication.getToken().getClaimAsString("role");
        String userId = authentication.getToken().getClaimAsString("userId");

        // Chỉ cho phép STAFF hoặc ADMIN tạo report by staff
        if (!"STAFF".equals(role) && !"ADMIN".equals(role)) {
            throw new AccessDeniedException("Bạn không có quyền tạo báo cáo này");
        }

        User staff = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        request.setType("Report by staff"); // gán type mặc định
        reportService.report(staff, request); // dùng lại service hiện tại

        return ResponseEntity.ok().build();
    }
}
