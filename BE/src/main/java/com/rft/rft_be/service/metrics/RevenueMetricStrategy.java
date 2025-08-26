package com.rft.rft_be.service.metrics;

import com.rft.rft_be.dto.metric.DataPoint;
import com.rft.rft_be.dto.metric.MetricMetadata;
import com.rft.rft_be.dto.metric.MetricResponse;
import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.repository.FinalContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RevenueMetricStrategy implements MetricStrategy {

    private final FinalContractRepository finalContractRepository;

    @Override
    public MetricResponse calculate(List<LocalDateTime> timePoints, String metric, String timeFrame, String providerId) {
        List<DataPoint> dataPoints = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal min = null;
        BigDecimal max = null;

        for (int i = 0; i < timePoints.size() - 1; i++) {
            LocalDateTime periodStart = timePoints.get(i);
            LocalDateTime periodEnd = timePoints.get(i + 1);

            BigDecimal value = calculateRevenue(periodStart, periodEnd, metric, providerId);

            dataPoints.add(DataPoint.builder()
                    .timestamp(periodStart.format(DateTimeFormatter.ISO_DATE_TIME) + "Z")
                    .value(value)
                    .build());

            total = total.add(value);
            if (min == null || value.compareTo(min) < 0) min = value;
            if (max == null || value.compareTo(max) > 0) max = value;
        }

        BigDecimal average = dataPoints.isEmpty() ? BigDecimal.ZERO :
                total.divide(BigDecimal.valueOf(dataPoints.size()), 2, RoundingMode.HALF_UP);

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

    private BigDecimal calculateRevenue(LocalDateTime start, LocalDateTime end, String metric, String providerId) {
        switch (metric) {
            case "revenue":
                List<FinalContract> allContracts  =
                        finalContractRepository.findByCreatedAtBetweenAndProvider(start, end, providerId);
                return allContracts.stream()
                        .map(FinalContract::getCostSettlement)
                        .filter(cost -> cost != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            case "successRevenue":  // THÊM MỚI - chỉ tính từ FinalContract completed
                List<FinalContract> completedContracts =
                        finalContractRepository.findCompletedByCreatedAtBetweenAndProvider(start, end, providerId);
                return completedContracts.stream()
                        .map(FinalContract::getCostSettlement)
                        .filter(cost -> cost != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            case "avgRevenue":
                List<FinalContract> contracts =
                        finalContractRepository.findCompletedByCreatedAtBetween(start, end);

                long uniqueCustomers = contracts.stream()
                        .map(fc -> fc.getContract().getBooking().getUser().getId())
                        .distinct()
                        .count();

                if (uniqueCustomers == 0) return BigDecimal.ZERO;

                BigDecimal totalRevenue = contracts.stream()
                        .map(FinalContract::getCostSettlement)
                        .filter(cost -> cost != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                return totalRevenue.divide(
                        BigDecimal.valueOf(uniqueCustomers),
                        2,
                        RoundingMode.HALF_UP
                );

            default:
                return BigDecimal.ZERO;
        }
    }

    private Double calculateGrowthRate(List<DataPoint> dataPoints) {
        if (dataPoints.size() < 2) return 0.0;

        BigDecimal first = (BigDecimal) dataPoints.get(0).getValue();
        BigDecimal last = (BigDecimal) dataPoints.get(dataPoints.size() - 1).getValue();

        if (first.compareTo(BigDecimal.ZERO) == 0) return 0.0;

        return last.subtract(first)
                .divide(first, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}