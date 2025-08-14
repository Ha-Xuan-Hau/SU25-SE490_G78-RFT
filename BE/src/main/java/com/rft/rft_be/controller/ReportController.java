package com.rft.rft_be.controller;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserReport;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<Void> createReport(@RequestBody ReportRequest request ) {
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getToken().getClaim("userId");

        User reporter = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        reportService.report(reporter, request);
        return ResponseEntity.ok().build();
    }

    /**
     * API lấy danh sách báo cáo theo loại tổng quát (generalType) như:
     * SERIOUS_ERROR, NON_SERIOUS_ERROR, STAFF_ERROR.
     * Kết quả được phân trang.
     */
    @GetMapping
    public ResponseEntity<List<ReportGroupedByTargetDTO>> getReportsByType(@RequestParam String type, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.getReportsByType(type, page, size));
    }

    /**
     * API tìm kiếm báo cáo theo từ khóa (keyword), loại lỗi cụ thể (type)
     * và loại lỗi tổng quát (generalType). Có hỗ trợ phân trang.
     */
    @GetMapping("/search")
    public ResponseEntity<List<ReportGroupedByTargetDTO>> searchReports(@RequestParam String generalType, @RequestParam(required = false) String keyword, @RequestParam(required = false) String type, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.searchReports(generalType, keyword, type, page, size));
    }

    /**
     * API lấy chi tiết báo cáo NON_SERIOUS (nhóm theo targetId và type)
     * Path: /api/reports/detail/grouped/{targetId}?type=SPAM
     */
    @GetMapping("/detail/grouped/{targetId}")
    public ResponseEntity<ReportDetailDTO> getGroupedReportDetail(
            @PathVariable String targetId,
            @RequestParam String type) {

        try {
            ReportDetailDTO detail = reportService.getGroupedReportDetail(targetId, type);
            if (detail == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(detail);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * API lấy chi tiết báo cáo SERIOUS hoặc STAFF_REPORT (theo reportId)
     * Path: /api/reports/detail/single/{reportId}
     */
    @GetMapping("/detail/single/{reportId}")
    public ResponseEntity<ReportDetailDTO> getSingleReportDetail(@PathVariable String reportId) {
        try {
            ReportDetailDTO detail = reportService.getSingleReportDetail(reportId);
            return ResponseEntity.ok(detail);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // SỬA endpoint /staff - dùng type STAFF_REPORT thay vì "Report by staff"
    @PostMapping("/staff")
    public ResponseEntity<Void> createReportByStaff(@RequestBody ReportRequest request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaimAsString("userId");

        User staff = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        request.setType("STAFF_REPORT");
        reportService.report(staff, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/process/reject-all")
    public ResponseEntity<Void> rejectAllReports(
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String reportId) {

        if (reportId != null) {
            // SERIOUS/STAFF: reject theo reportId
            reportService.rejectSingleReport(reportId);
        } else if (targetId != null && type != null) {
            // NON_SERIOUS: reject theo targetId + type
            reportService.rejectAllReports(targetId, type);
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/process/staff-approve-all")
    @Transactional
    public ResponseEntity<Map<String, String>> approveAllReportsAndCreateStaffFlag(
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String reportId,
            @RequestParam(required = false) String bookingId,
            @RequestParam String reason) {

        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getToken().getClaimAsString("userId");
        //String role = auth.getToken().getClaimAsString("scope");

        // Kiểm tra quyền
//        if (!"STAFF".equals(role) && !"ADMIN".equals(role)) {
//            throw new AccessDeniedException("Chỉ STAFF hoặc ADMIN mới có quyền");
//        }

        User staff = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        String finalTargetId;

        // 1. Approve reports hiện tại và lấy targetId
        if (reportId != null) {
            // SERIOUS: approve single report
            UserReport report = reportService.getReportById(reportId);
            finalTargetId = report.getReportedId();
            reportService.approveSingleReport(reportId);
        } else if (targetId != null && type != null) {
            // NON_SERIOUS: approve all reports
            finalTargetId = targetId;
            reportService.approveAllReports(targetId, type);
        } else {
            throw new IllegalArgumentException("Thiếu tham số bắt buộc");
        }

        // 2. Tạo STAFF_REPORT mới
        ReportRequest staffRequest = new ReportRequest();
        staffRequest.setTargetId(finalTargetId);
        staffRequest.setType("STAFF_REPORT");
        staffRequest.setReason(reason);
        if(bookingId != null) {
            staffRequest.setBooking(bookingId);
        }


        String staffReportId = reportService.createStaffReport(staff, staffRequest);

        Map<String, String> response = new HashMap<>();
        response.put("staffReportId", staffReportId);
        response.put("targetId", finalTargetId);

        return ResponseEntity.ok(response);
    }



    @PutMapping("/appeal/{id}/approve")
    public ResponseEntity<Void> approveAppeal(@PathVariable String id) {
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String role = auth.getToken().getClaimAsString("role");

//        if (!"STAFF".equals(role) && !"ADMIN".equals(role)) {
//            throw new AccessDeniedException("Chỉ staff hoặc admin mới có thể xử lý kháng cáo");
//        }

        reportService.processAppealDecision(id, true);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/appeal/{id}/reject")
    public ResponseEntity<Void> rejectAppeal(@PathVariable String id) {
        JwtAuthenticationToken auth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String role = auth.getToken().getClaimAsString("role");

//        if (!"STAFF".equals(role) && !"ADMIN".equals(role)) {
//            throw new AccessDeniedException("Chỉ staff hoặc admin mới có thể xử lý kháng cáo");
//        }

        reportService.processAppealDecision(id, false);
        return ResponseEntity.ok().build();
    }
}
