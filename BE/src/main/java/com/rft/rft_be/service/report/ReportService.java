package com.rft.rft_be.service.report;

import com.rft.rft_be.dto.report.ReportDTO;
import com.rft.rft_be.dto.report.ReportGroupedByTargetDTO;
import com.rft.rft_be.dto.report.ReportRequest;
import com.rft.rft_be.entity.User;

import java.util.List;

public interface ReportService {
    void report(User reporter, ReportRequest request);
    List<ReportDTO> getReportsByType(String type);
    ReportGroupedByTargetDTO getReportsSeparatedByTargetType();
    List<ReportDTO> searchUserReports(String keyword);
    List<ReportDTO> searchVehicleReports(String keyword);
}
