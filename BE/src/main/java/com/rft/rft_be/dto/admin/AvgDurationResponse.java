package com.rft.rft_be.dto.admin;

public record AvgDurationResponse(
        double hours,  // Số giờ trung bình
        double days    // Số ngày (có thể < 1)
) {
    // Constructor từ số giờ
    public static AvgDurationResponse fromHours(Double hours) {
        if (hours == null) hours = 0.0;
        return new AvgDurationResponse(hours, hours / 24.0);
    }
}