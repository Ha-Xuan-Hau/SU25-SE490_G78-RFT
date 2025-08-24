package com.rft.rft_be.service.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MetricStrategyFactory {

    private final CustomerMetricStrategy customerStrategy;
    private final BookingMetricStrategy bookingStrategy;
    private final RevenueMetricStrategy revenueStrategy;
    private final ConversionRateStrategy conversionRateStrategy;

    public MetricStrategy getStrategy(String metric) {
        switch (metric) {
            case "customers":
            case "successCustomers":
                return customerStrategy;

            case "bookings":
            case "successBookings":
                return bookingStrategy;

            case "revenue":
            case "successRevenue":
            case "avgRevenue":
                return revenueStrategy;

            case "conversionRate":
                return conversionRateStrategy;

            default:
                throw new IllegalArgumentException("Unknown metric: " + metric);
        }
    }
}
