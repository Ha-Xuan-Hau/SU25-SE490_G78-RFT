package com.rft.rft_be.dto.report;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ReportGroupedByTargetDTO {
    private List<ReportDTO> userReports;
    private List<ReportDTO> vehicleReports;
}
