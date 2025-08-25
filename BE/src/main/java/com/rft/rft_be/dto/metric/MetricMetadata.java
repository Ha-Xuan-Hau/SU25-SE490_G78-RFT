package com.rft.rft_be.dto.metric;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MetricMetadata {
    private Object total;
    private Object average;
    private Object min;
    private Object max;
    private Double growthRate;
}
