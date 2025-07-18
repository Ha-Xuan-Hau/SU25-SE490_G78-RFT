package com.rft.rft_be.controller;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.repository.UserReportRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final UserRepository userRepo;
    @PostMapping
    public ResponseEntity<?> report(@AuthenticationPrincipal Jwt jwt,
                                    @RequestBody ReportRequest request) {
        String reporterId = jwt.getClaim("userId");
        User reporter = userRepo.findById(reporterId).orElseThrow();
        reportService.report(reporter, request);
        return ResponseEntity.ok("Report submitted");
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ReportDTO>> getReportsByType(@PathVariable String type) {
        return ResponseEntity.ok(reportService.getReportsByType(type));
    }

    @GetMapping("/separate-by-target")
    public ResponseEntity<ReportGroupedByTargetDTO> getReportsSeparatedByTargetType() {
        return ResponseEntity.ok(reportService.getReportsSeparatedByTargetType());
    }
    @GetMapping("/search/user")
    public ResponseEntity<List<ReportDTO>> searchUserReports(@RequestParam String keyword) {
        return ResponseEntity.ok(reportService.searchUserReports(keyword));
    }

    @GetMapping("/search/vehicle")
    public ResponseEntity<List<ReportDTO>> searchVehicleReports(@RequestParam String keyword) {
        return ResponseEntity.ok(reportService.searchVehicleReports(keyword));
    }
}
