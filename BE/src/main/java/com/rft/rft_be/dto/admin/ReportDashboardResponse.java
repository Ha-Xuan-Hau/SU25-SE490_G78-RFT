package com.rft.rft_be.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDashboardResponse {
    private long pendingTotal;
    private ReportStatisticDTO nonSerious;
    private ReportStatisticDTO serious;
}
