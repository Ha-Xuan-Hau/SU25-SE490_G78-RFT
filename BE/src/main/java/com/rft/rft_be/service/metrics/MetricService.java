package com.rft.rft_be.service.metrics;


import com.rft.rft_be.dto.metric.DataPoint;
import com.rft.rft_be.dto.metric.MetricMetadata;
import com.rft.rft_be.dto.metric.MetricRequest;
import com.rft.rft_be.dto.metric.MetricResponse;
import com.rft.rft_be.service.metrics.MetricStrategy;
import com.rft.rft_be.service.metrics.MetricStrategyFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetricService {

    private final MetricStrategyFactory strategyFactory;

    public MetricResponse getMetric(MetricRequest request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String providerId = authentication.getToken().getClaim("userId");
        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());

        String timeFrame = determineTimeFrame(startDate, endDate, request.getGroupBy());
        List<LocalDateTime> timePoints = generateTimePoints(startDate, endDate, timeFrame);

        MetricStrategy strategy = strategyFactory.getStrategy(request.getMetric());

        return strategy.calculate(timePoints, request.getMetric(), timeFrame, providerId);
    }

    private String determineTimeFrame(LocalDate startDate, LocalDate endDate, String groupBy) {
        if (groupBy != null) {
            switch (groupBy) {
                case "hour": return "hourly";
                case "day": return "daily";
                case "week": return "weekly";
                case "month": return "monthly";
            }
        }

        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);

        if (daysBetween <= 7) {
            return "hourly";
        } else if (daysBetween <= 31) {
            return "daily";
        } else if (daysBetween <= 62) {
            return "weekly";
        } else {
            return "monthly";
        }
    }

    private List<LocalDateTime> generateTimePoints(LocalDate startDate, LocalDate endDate, String timeFrame) {
        List<LocalDateTime> timePoints = new ArrayList<>();
        LocalDateTime current = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        switch (timeFrame) {
            case "hourly":
                while (!current.isAfter(end)) {
                    timePoints.add(current);
                    timePoints.add(current.plusHours(8));
                    timePoints.add(current.plusHours(16));
                    current = current.plusDays(1);
                }
                break;

            case "daily":
                while (!current.isAfter(end)) {
                    timePoints.add(current);
                    current = current.plusDays(1);
                }
                break;

            case "weekly":
                while (!current.isAfter(end)) {
                    timePoints.add(current);
                    current = current.plusWeeks(1);
                }
                break;

            case "monthly":
                while (!current.isAfter(end)) {
                    timePoints.add(current);
                    current = current.plusMonths(1);
                }
                break;
        }

        if (!timePoints.contains(end)) {
            timePoints.add(end);
        }

        return timePoints;
    }
}

