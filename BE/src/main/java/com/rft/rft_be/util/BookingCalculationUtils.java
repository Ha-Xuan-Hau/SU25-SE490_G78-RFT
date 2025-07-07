package com.rft.rft_be.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

public class BookingCalculationUtils {

    // Constants
    public static final int HOURLY_THRESHOLD = 8; // <= 8 giờ tính theo giờ
    public static final int DAILY_THRESHOLD = 24; // > 8 giờ nhưng <= 24 giờ = 1 ngày
    public static final int HOURS_PER_DAY_FOR_RATE = 12; // Chia giá ngày cho 12 để ra giá giờ

    @Data
    @Builder
    public static class RentalCalculation {

        private long totalHours;
        private long totalMinutes;
        private boolean isHourlyRate;
        private int billingDays;
        private int billingHours;
        private int billingMinutes;
        private String priceType; // "hourly" hoặc "daily"
    }

    /**
     * Tính toán thời gian thuê và loại tính giá
     */
    public static RentalCalculation calculateRentalDuration(LocalDateTime startTime, LocalDateTime endTime) {
        Duration duration = Duration.between(startTime, endTime);
        long totalHours = duration.toHours();
        long totalMinutes = duration.toMinutes();

        if (totalHours <= HOURLY_THRESHOLD) {
            // Tính theo giờ + phút
            int hours = (int) totalHours;
            int minutes = (int) (totalMinutes % 60);

            return RentalCalculation.builder()
                    .totalHours(totalHours)
                    .totalMinutes(totalMinutes)
                    .isHourlyRate(true)
                    .billingDays(0)
                    .billingHours(hours)
                    .billingMinutes(minutes)
                    .priceType("hourly")
                    .build();
        } else {
            // Tính theo ngày
            int billingDays;
            if (totalHours <= DAILY_THRESHOLD) {
                // <= 24 giờ = 1 ngày
                billingDays = 1;
            } else {
                // > 24 giờ = làm tròn lên ngày
                billingDays = (int) Math.ceil((double) totalHours / 24);
            }

            return RentalCalculation.builder()
                    .totalHours(totalHours)
                    .totalMinutes(totalMinutes)
                    .isHourlyRate(false)
                    .billingDays(billingDays)
                    .billingHours(0)
                    .billingMinutes(0)
                    .priceType("daily")
                    .build();
        }
    }

    /**
     * Tính giá tiền dựa trên thời gian thuê
     */
    public static BigDecimal calculateRentalPrice(RentalCalculation calculation, BigDecimal dailyRate) {
        if (calculation.isHourlyRate()) {
            // Tính giá theo giờ (dailyRate / 12)
            BigDecimal hourlyRate = dailyRate.divide(BigDecimal.valueOf(HOURS_PER_DAY_FOR_RATE), 2, RoundingMode.HALF_UP);

            // Tính giá cho số giờ
            BigDecimal hourPrice = hourlyRate.multiply(BigDecimal.valueOf(calculation.getBillingHours()));

            // Tính giá cho số phút (phút / 60 * giá_giờ)
            BigDecimal minutePrice = BigDecimal.ZERO;
            if (calculation.getBillingMinutes() > 0) {
                BigDecimal minuteRate = hourlyRate.divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
                minutePrice = minuteRate.multiply(BigDecimal.valueOf(calculation.getBillingMinutes()));
            }

            return hourPrice.add(minutePrice).setScale(0, RoundingMode.HALF_UP);
        } else {
            // Tính theo ngày
            return dailyRate.multiply(BigDecimal.valueOf(calculation.getBillingDays()));
        }
    }

    /**
     * Format hiển thị thời gian thuê
     */
    public static String formatRentalDuration(RentalCalculation calculation) {
        if (calculation.isHourlyRate()) {
            if (calculation.getBillingMinutes() > 0) {
                return calculation.getBillingHours() + " giờ " + calculation.getBillingMinutes() + " phút";
            }
            return calculation.getBillingHours() + " giờ";
        } else {
            return calculation.getBillingDays() + " ngày";
        }
    }

    /**
     * Tính giá giờ từ giá ngày
     */
    public static BigDecimal calculateHourlyRate(BigDecimal dailyRate) {
        return dailyRate.divide(BigDecimal.valueOf(HOURS_PER_DAY_FOR_RATE), 2, RoundingMode.HALF_UP);
    }
}
