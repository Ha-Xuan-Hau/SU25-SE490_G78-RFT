package com.rft.rft_be.dto.vehicle.vehicleRent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderStatisticsDTO {
    // Thông tin cơ bản của provider
    private String providerId;
    private String providerName;
    private String providerEmail;
    private String providerPhone;
    private String providerAddress;
    private LocalDateTime openTime;
    private LocalDateTime closeTime;
    private List<String> registeredServices; // Các dịch vụ đã đăng ký (CAR, MOTORBIKE, BICYCLE)
    
    // Thống kê xe
    private Long totalVehicles;
    private Long totalCars;
    private Long totalMotorbikes;
    private Long totalBicycles;
    
    // Thống kê contract trong tháng hiện tại
    private Long totalRentingContracts; // Trạng thái RENTING
    private Long totalFinishedContracts; // Trạng thái FINISHED
    private Long totalCancelledContracts; // Trạng thái CANCELLED
    
    // Thống kê doanh thu từ final contract trong tháng hiện tại
    private BigDecimal totalRevenue; // Tổng doanh thu
    private Long totalFinalContracts; // Tổng số final contract
    
    // Thống kê theo tháng (cho biểu đồ)
    private List<MonthlyRevenueDTO> monthlyRevenue;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDTO {
        private String month; // "Jan", "Feb", etc.
        private Long orderCount; // Số đơn hàng
        private BigDecimal revenue; // Doanh thu
    }
}
