// src/main/java/com/rft/rft_be/controller/AdminDashboardController.java
package com.rft.rft_be.controller;

import com.rft.rft_be.dto.*;
import com.rft.rft_be.dto.admin.AvgDurationResponse;
import com.rft.rft_be.dto.admin.CountResponse;
import com.rft.rft_be.dto.admin.MoneyResponse;
import com.rft.rft_be.dto.admin.MonthlyBookingSummaryResponse;
import com.rft.rft_be.service.admin.AdminDashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService service;

    public AdminDashboardController(AdminDashboardService service) {
        this.service = service;
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
}
