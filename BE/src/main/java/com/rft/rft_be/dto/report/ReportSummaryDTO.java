package com.rft.rft_be.dto.report;

import lombok.*;

@Getter
@Setter
// Thông tin chung của một báo cáo
public class ReportSummaryDTO {
    private String reportId;
    private String type;
    private String booking;
}
