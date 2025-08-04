package com.rft.rft_be.dto.report;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
// DTO trả về chi tiết một đối tượng bị báo cáo
public class ReportDetailDTO {
    private ReportSummaryDTO reportSummary;
    private ReportedUserDTO reportedUser;
    private List<ReporterDetailDTO> reporters;
}
