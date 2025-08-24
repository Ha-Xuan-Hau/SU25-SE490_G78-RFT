package com.rft.rft_be.dto.vehicle.vehicleRent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatisticsDTO {
    private int month;
    private int year;
    
    // Thống kê khách hàng
    private Long totalCustomersWithFinalContract;     // Tổng khách hàng có final contract trong tháng, tính cả chưa thanh toán và đã hủy
    private Long customersWithCompletedContracts;     // Khách hàng có contract hoàn thành
    
    // Thống kê doanh thu
    private BigDecimal totalRevenueFromFinalContracts;    // Tổng doanh thu từ final contracts
    private BigDecimal revenueFromCompletedContracts;     // Doanh thu từ contracts hoàn thành
    private BigDecimal averageRevenuePerCustomer;         // Doanh thu trung bình/khách hàng
    
    // Thống kê final contracts (đây mới là "đơn hàng" thực sự)
    private Long totalFinalContracts;          // Tổng số đơn hàng
    private Long completedFinalContracts;      // Số final đơn hàng hoàn thành
    private Long cancelledFinalContracts;      // Số final đơn hàng bị hủy
}
