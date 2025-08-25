package com.rft.rft_be.dto.metric;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MetricResponse {
    private String metric;
    private String timeFrame;
    private List<DataPoint> data;
    private MetricMetadata metadata;
}
