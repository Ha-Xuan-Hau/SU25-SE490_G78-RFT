// src/main/java/com/rft/rft_be/controller/AdminDashboardController.java
package com.rft.rft_be.controller;

import com.rft.rft_be.dto.*;
import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.service.admin.AdminDashboardService;
import com.rft.rft_be.service.admin.CouponService;
import com.rft.rft_be.service.report.ReportService;
import com.rft.rft_be.service.report.ReportServiceImpl;
import com.rft.rft_be.service.wallet.WalletService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService service;
    private final ReportService reportService;
    private final WalletService walletService;
    private final CouponService couponService;
    public AdminDashboardController(AdminDashboardService service,  ReportService reportService, WalletService walletService, CouponService couponService) {
        this.service = service;
        this.reportService = reportService;
        this.walletService = walletService;
        this.couponService = couponService;
    }

    // 1) Tổng số lượng hợp đồng tất toán (theo tháng)
    @GetMapping("/settlements/total")
    public CountResponse getTotalSettlements(@RequestParam(value = "month", required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.getTotalSettlements(month);
    }

    // 2) Tổng giá trị tất toán (theo tháng)
    @GetMapping("/settlements/amount")
    public MoneyResponse getTotalSettlementAmount(@RequestParam(value = "month", required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.getTotalSettlementAmount(month);
    }

    // 3) Thời gian thuê trung bình (ngày) — completed trong tháng
    @GetMapping("/rentals/avg-duration")
    public AvgDurationResponse getAverageRentalDuration(@RequestParam(value = "month", required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.getAverageRentalDurationDays(month);
    }

    // 4) Tổng số đơn đặt xe trong tháng + breakdown
    @GetMapping("/bookings/monthly")
    public MonthlyBookingSummaryResponse getMonthlyBookingSummary(@RequestParam(value = "month", required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.getMonthlyBookingSummary(month);
    }

    // 5) Tổng số đơn đặt xe (để FE tự so sánh với tháng trước)
    @GetMapping("/bookings/total")
    public CountResponse getMonthlyTotalBookings(@RequestParam(value = "month", required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.getMonthlyTotalBookings(month);
    }
    // Total report
    @GetMapping("reports")
    public ReportDashboardResponse getReportStatistics(
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);

        LocalDate fromDate = (from != null) ? from : startOfMonth;
        LocalDate toDate = (to != null) ? to : today;

        return reportService.getDashboardReportStatistics(
                fromDate.atStartOfDay(),
                toDate.atTime(23, 59, 59));
    }

    @GetMapping("withdrawals")
    public WithdrawalDashboardResponse getWithdrawalStats(
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);

        LocalDate fromDate = (from != null) ? from : startOfMonth;
        LocalDate toDate   = (to   != null) ? to   : today;

        LocalDateTime fromDt = fromDate.atStartOfDay();
        LocalDateTime toDt   = toDate.atTime(23, 59, 59);

        return walletService.getWithdrawalDashboard(fromDt, toDt);
    }
    /**
     * Mặc định: trả toàn bộ coupon trong hệ thống.
     * Optional: filter theo khoảng ngày tạo (ví dụ 2025-08-01 -> 2025-08-31) để xem “tháng này/tháng trước”.
     */
    @GetMapping("coupons")
    public CouponDashboardResponse getCouponsForDashboard(
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return couponService.getCouponDashboard(from, to);
    }
}
