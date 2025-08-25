package com.rft.rft_be.dto.metric;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DataPoint {
    private String timestamp;
    private Object value;
}