package com.rft.rft_be.service.report;

import com.rft.rft_be.dto.report.ReportDTO;
import com.rft.rft_be.dto.report.ReportDetailDTO;
import com.rft.rft_be.dto.report.ReportGroupedByTargetDTO;
import com.rft.rft_be.dto.report.ReportRequest;
import com.rft.rft_be.entity.User;

import java.util.List;

public interface ReportService {
    void report(User reporter, ReportRequest request);

    List<ReportGroupedByTargetDTO> getReportsByType(String generalType, int page, int size);

    List<ReportGroupedByTargetDTO> searchReports(String generalType, String keyword, String type, int page, int size);

    ReportDetailDTO getReportDetailByTargetAndType(String targetId, String type);
}
