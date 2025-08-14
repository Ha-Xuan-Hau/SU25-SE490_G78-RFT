package com.rft.rft_be.service.report;

import com.rft.rft_be.dto.report.ReportDTO;
import com.rft.rft_be.dto.report.ReportDetailDTO;
import com.rft.rft_be.dto.report.ReportGroupedByTargetDTO;
import com.rft.rft_be.dto.report.ReportRequest;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserReport;

import java.util.List;

public interface ReportService {
    void report(User reporter, ReportRequest request);

    List<ReportGroupedByTargetDTO> getReportsByType(String generalType, int page, int size);

    List<ReportGroupedByTargetDTO> searchReports(String generalType, String keyword, String type, int page, int size);

    ReportDetailDTO getReportDetailByTargetAndType(String targetId, String type);

    // Method reject cho NON_SERIOUS
    void rejectAllReports(String targetId, String type);

    // Method reject cho SERIOUS/STAFF
    void rejectSingleReport(String reportId);

    void approveAllReports(String targetId, String type);
    void approveSingleReport(String reportId);
    String createStaffReport(User staff, ReportRequest request);
    UserReport getReportById(String reportId);

    //approve kháng cáo từ bị cáo
    void processAppealDecision(String appealId, boolean approved);

    ReportDetailDTO getGroupedReportDetail(String targetId, String type);
    ReportDetailDTO getSingleReportDetail(String reportId);

}
