package com.rft.rft_be.service.metrics;

import com.rft.rft_be.dto.metric.MetricResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface MetricStrategy {
    MetricResponse calculate(List<LocalDateTime> timePoints, String metric, String timeFrame, String providerId);
}
