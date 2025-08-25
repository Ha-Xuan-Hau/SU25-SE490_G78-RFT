package com.rft.rft_be.dto.metric;

import lombok.Data;

@Data
public class MetricRequest {
    private String startDate;     // "2024-01-01"
    private String endDate;       // "2024-01-31"
    private String metric;
    private String groupBy;       // Optional: "hour" | "day" | "week" | "month"
    //customers - Tất cả khách hàng
    //successCustomers - Khách hàng có đơn thành công
    //bookings - Tất cả đơn đặt xe
    //successBookings - Đơn đặt xe thành công
    //revenue - Tổng doanh thu (từ tất cả FinalContract)
    //successRevenue - Doanh thu từ đơn thành công (Contract.status = FINISHED)
    //avgRevenue - Doanh thu trung bình/khách hàng
    //conversionRate - Tỉ lệ chuyển đổi (%)

}
