package com.rft.rft_be.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardSummaryDTO {
    private Overview overview;
    private Users users;
    private Vehicles vehicles;
    private List<VehicleTypeItem> vehicleTypes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Overview {
        private long activeVehicles;      // đang hoạt động
        private long totalVehicles;       // tổng số
        private long pendingVehicles;     // chờ duyệt
        private double pendingChangePercent; // % so với tháng trước
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Users {
        private long totalUsers;              // tổng số người dùng
        private long newUsersLast30Days;      // người dùng mới 30 ngày
        private double usersChangePercent;    // % so với tháng trước (người dùng mới theo tháng)
        private long totalProviders;          // tổng chủ xe
        private double providersChangePercent;// % so với tháng trước (chủ xe mới theo tháng)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Vehicles {
        private long active;     // AVAILABLE
        private long pending;    // PENDING
        private long suspended;  // SUSPENDED
        private long deleted;    // UNAVAILABLE
        private long total;      // tổng
        private double activePercent;
        private double pendingPercent;
        private double suspendedPercent;
        private double deletedPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleTypeItem {
        private String type;   // CAR/MOTORBIKE/BICYCLE
        private long active;   // số đang hoạt động
        private long total;    // tổng theo loại
        private long pending;  // số đang chờ duyệt
        private long suspended; // số bị đình chỉ
        private Long providers; // số chủ có loại xe này (optional)
    }
}


