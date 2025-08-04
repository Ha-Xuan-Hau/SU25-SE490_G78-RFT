package com.rft.rft_be.dto.report;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
// DTO gom nhóm các báo cáo theo từng đối tượng bị báo cáo
public class ReportGroupedByTargetDTO {
    private String targetId;
    private String reportedNameOrVehicle;
    private String email;
    private String type;
    private long count;
}
