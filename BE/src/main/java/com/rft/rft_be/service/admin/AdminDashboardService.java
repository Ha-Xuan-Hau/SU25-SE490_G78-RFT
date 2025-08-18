package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.AvgDurationResponse;
import com.rft.rft_be.dto.admin.CountResponse;
import com.rft.rft_be.dto.admin.MoneyResponse;
import com.rft.rft_be.dto.admin.MonthlyBookingSummaryResponse;
import com.rft.rft_be.dto.admin.AdminDashboardSummaryDTO;

import java.time.YearMonth;

public interface AdminDashboardService {
    // 1) Tổng số lượng hợp đồng tất toán
    CountResponse getTotalSettlements(YearMonth month);

    // 2) Tổng giá trị tất toán (chỉ tính Contract.FINISHED)
    MoneyResponse getTotalSettlementAmount(YearMonth month);

    // 3) Thời gian thuê trung bình (ngày)
    AvgDurationResponse getAverageRentalDurationDays(YearMonth month);

    // 4) Tổng số đơn đặt xe trong tháng + breakdown
    MonthlyBookingSummaryResponse getMonthlyBookingSummary(YearMonth month);

    // 5) Tổng số đơn đặt xe (FE tự so sánh tháng trước)
    CountResponse getMonthlyTotalBookings(YearMonth month);

    // E) tổng số phương tiện , người dùng,phân loại phương tiện...
    AdminDashboardSummaryDTO getVehicle_User(YearMonth month);
}