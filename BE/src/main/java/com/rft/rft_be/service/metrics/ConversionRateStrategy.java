package com.rft.rft_be.service.metrics;

import com.rft.rft_be.dto.metric.DataPoint;
import com.rft.rft_be.dto.metric.MetricMetadata;
import com.rft.rft_be.dto.metric.MetricResponse;
import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.repository.FinalContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ConversionRateStrategy implements MetricStrategy {

    private final FinalContractRepository finalContractRepository;

    @Override
    public MetricResponse calculate(List<LocalDateTime> timePoints, String metric, String timeFrame, String providerId) {
        List<DataPoint> dataPoints = new ArrayList<>();
        double total = 0;
        Double min = null;
        Double max = null;

        for (int i = 0; i < timePoints.size() - 1; i++) {
            LocalDateTime periodStart = timePoints.get(i);
            LocalDateTime periodEnd = timePoints.get(i + 1);

            double value = calculateConversionRate(periodStart, periodEnd, providerId);

            dataPoints.add(DataPoint.builder()
                    .timestamp(periodStart.format(DateTimeFormatter.ISO_DATE_TIME) + "Z")
                    .value(value)
                    .build());

            total += value;
            if (min == null || value < min) min = value;
            if (max == null || value > max) max = value;
        }

        double average = dataPoints.isEmpty() ? 0 : total / dataPoints.size();

        return MetricResponse.builder()
                .metric(metric)
                .timeFrame(timeFrame)
                .data(dataPoints)
                .metadata(MetricMetadata.builder()
                        .total(total)
                        .average(average)
                        .min(min)
                        .max(max)
                        .growthRate(0.0)
                        .build())
                .build();
    }

    private double calculateConversionRate(LocalDateTime start, LocalDateTime end, String providerId) {
        List<FinalContract> allContracts =
                finalContractRepository.findByCreatedAtBetweenAndProvider(start, end, providerId);
        List<FinalContract> completedContracts =
                finalContractRepository.findCompletedByCreatedAtBetweenAndProvider(start, end, providerId);

        if (allContracts.isEmpty()) return 0.0;

        return ((double) completedContracts.size() / allContracts.size()) * 100;
    }
}