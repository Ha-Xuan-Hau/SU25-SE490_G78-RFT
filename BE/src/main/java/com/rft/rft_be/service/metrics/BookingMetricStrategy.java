package com.rft.rft_be.service.metrics;


import com.rft.rft_be.dto.metric.DataPoint;
import com.rft.rft_be.dto.metric.MetricMetadata;
import com.rft.rft_be.dto.metric.MetricResponse;
import com.rft.rft_be.repository.FinalContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingMetricStrategy implements MetricStrategy {

    private final FinalContractRepository finalContractRepository;

    @Override
    public MetricResponse calculate(List<LocalDateTime> timePoints, String metric, String timeFrame, String providerId) {
        List<DataPoint> dataPoints = new ArrayList<>();
        int total = 0;
        Integer min = null;
        Integer max = null;

        for (int i = 0; i < timePoints.size() - 1; i++) {
            LocalDateTime periodStart = timePoints.get(i);
            LocalDateTime periodEnd = timePoints.get(i + 1);

            int value = calculateBookings(periodStart, periodEnd, metric, providerId);

            dataPoints.add(DataPoint.builder()
                    .timestamp(periodStart.format(DateTimeFormatter.ISO_DATE_TIME) + "Z")
                    .value(value)
                    .build());

            total += value;
            if (min == null || value < min) min = value;
            if (max == null || value > max) max = value;
        }

        double average = dataPoints.isEmpty() ? 0 : (double) total / dataPoints.size();
        Double growthRate = calculateGrowthRate(dataPoints);

        return MetricResponse.builder()
                .metric(metric)
                .timeFrame(timeFrame)
                .data(dataPoints)
                .metadata(MetricMetadata.builder()
                        .total(total)
                        .average(average)
                        .min(min)
                        .max(max)
                        .growthRate(growthRate)
                        .build())
                .build();
    }

    private int calculateBookings(LocalDateTime start, LocalDateTime end, String metric, String providerId) {
        switch (metric) {
            case "bookings":
                return finalContractRepository.findByCreatedAtBetweenAndProvider(start, end, providerId).size();

            case "successBookings":
                return finalContractRepository.findCompletedByCreatedAtBetweenAndProvider(start, end, providerId).size();

            default:
                return 0;
        }
    }

    private Double calculateGrowthRate(List<DataPoint> dataPoints) {
        if (dataPoints.size() < 2) return 0.0;

        Integer first = (Integer) dataPoints.get(0).getValue();
        Integer last = (Integer) dataPoints.get(dataPoints.size() - 1).getValue();

        if (first == 0) return 0.0;

        return ((double) (last - first) / first) * 100;
    }
}