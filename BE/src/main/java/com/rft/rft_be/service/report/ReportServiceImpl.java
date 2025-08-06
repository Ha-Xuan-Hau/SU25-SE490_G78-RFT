package com.rft.rft_be.service.report;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserReport;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.ReportMapper;
import com.rft.rft_be.repository.UserReportRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.util.ProfanityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.rft.rft_be.util.PaginationUtils.paginate;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final UserReportRepository reportRepo;
    private final UserRepository userRepo;
    private final VehicleRepository vehicleRepo;
    private final ReportMapper reportMapper;

    private final List<String> seriousReport = List.of(
            "DAMAGED_VEHICLE", // khách làm hư hỏng xe
            "FRAUD",                      // Gian lận
            "MISLEADING_INFO",            // Xe khác với mô tả
            "OWNER_NO_SHOW",              // Chủ xe không giao xe
            "OWNER_CANCEL_UNREASONABLY",  // Chủ xe huỷ đơn không lý do
            "DOCUMENT_ISSUE",             // Giấy tờ sai/mất
            "TECHNICAL_ISSUE",            // Xe bị lỗi kỹ thuật
            "UNSAFE_VEHICLE",             // Xe không an toàn
            "FUEL_LEVEL_INCORRECT",   // Mức nhiên liệu không đúng như cam kết`
            "NO_INSURANCE",               // Không có bảo hiểm
            "EXPIRED_INSURANCE",          // Bảo hiểm hết hạn
            "FAKE_DOCUMENT",              // Khách cung cấp giấy tờ giả
            "FAKE_ORDER",                 // Khách đặt đơn giả
            "DISPUTE_REFUND",     // Tranh chấp hoàn tiền/phạt
            "LATE_RETURN_NO_CONTACT"      // Không trả xe đúng hạn và mất liên lạc
    );
    private final List<String> nonSeriousReport = List.of(
            "INAPPROPRIATE",      // Ngôn từ không phù hợp
            "VIOLENCE",           // Bạo lực
            "SPAM",               // Spam
            "OTHERS",             // Khác
            "DIRTY_CAR",          // Xe bẩn
            "MISLEADING_LISTING"  // Thông tin sai trong bài đăng
    );
    private final List<String> staffReport = List.of("STAFF_REPORT");

    /**
     * Tạo mới một báo cáo dựa trên thông tin từ người báo cáo và yêu cầu.
     * Gán loại `generalType` theo type cụ thể ("Lừa đảo" → "SERIOUS_ERROR", ...)
     * Sau đó map từ DTO sang entity và lưu vào database.
     */
    @Override
    public void report(User reporter, ReportRequest request) {
        String type = request.getType();
        if (seriousReport.contains(type)) {
            request.setGeneralType("SERIOUS_ERROR");
        } else if (nonSeriousReport.contains(type)) {
            request.setGeneralType("NON_SERIOUS_ERROR");
        } else if (staffReport.contains(type) || "Report by staff".equalsIgnoreCase(type)) {
            request.setGeneralType("STAFF_ERROR");
        } else {
            request.setGeneralType("NON_SERIOUS_ERROR");
        }

        UserReport report = reportMapper.toEntity(request);
        report.setReporter(reporter);
        report.setCreatedAt(java.time.LocalDateTime.now());
        reportRepo.save(report);
    }
    /**
     * Trả về tên của đối tượng bị báo cáo, có thể là tên người dùng hoặc biển số xe.
     * Ưu tiên lấy từ User nếu tồn tại, nếu không thì tìm từ Vehicle.
     */
    private String resolveReportedName(String targetId) {
        return userRepo.findById(targetId).map(User::getFullName)
                .orElse(vehicleRepo.findById(targetId).map(Vehicle::getLicensePlate).orElse("N/A"));
    }
    private String resolveReportedEmail(String targetId) {
        return userRepo.findById(targetId).map(User::getEmail).orElse("");
    }
    /**
     * Lọc tất cả các báo cáo theo `generalType` (SERIOUS, NON_SERIOUS, STAFF),
     * sắp xếp theo thời gian giảm dần và gom nhóm theo `reportedId`.
     * Trả về danh sách `ReportGroupedByTargetDTO` chứa loại lỗi và số lần bị báo.
     */
    @Override
    public List<ReportGroupedByTargetDTO> getReportsByType(String generalType, int page, int size) {
        List<UserReport> filteredReports = reportRepo.findAll().stream()
                .filter(r -> matchGeneralType(r.getType(), generalType))
                .collect(Collectors.toList());

        List<ReportGroupedByTargetDTO> grouped = buildGroupedDTOList(filteredReports).stream()
                .sorted(Comparator.comparingLong(ReportGroupedByTargetDTO::getCount).reversed())
                .collect(Collectors.toList());

        return paginate(grouped, page, size);
    }
    /**
     * Tìm kiếm báo cáo theo `generalType`, từ khóa (keyword) và loại lỗi cụ thể (type).
     * Kết quả được gom nhóm theo `reportedId` và trả về danh sách `ReportGroupedByTargetDTO`.
     */
    @Override
    public List<ReportGroupedByTargetDTO> searchReports(String generalType, String keyword, String type, int page, int size) {
        List<UserReport> filteredReports = reportRepo.findAll().stream()
                .filter(r -> matchGeneralType(r.getType(), generalType))
                .filter(r -> keyword == null || resolveReportedName(r.getReportedId()).toLowerCase().contains(keyword.toLowerCase()))
                .filter(r -> type == null || r.getType().equalsIgnoreCase(type))
                .collect(Collectors.toList());

        List<ReportGroupedByTargetDTO> grouped = buildGroupedDTOList(filteredReports);
        return paginate(grouped, page, size);
    }

    private boolean matchGeneralType(String type, String generalType) {
        return ("SERIOUS_ERROR".equals(generalType) && seriousReport.contains(type)) ||
                ("NON_SERIOUS_ERROR".equals(generalType) && nonSeriousReport.contains(type)) ||
                ("STAFF_ERROR".equals(generalType) && staffReport.contains(type));
    }
    /**
     * Gom nhóm danh sách báo cáo theo `reportedId`, sau đó xây dựng danh sách
     * `ReportGroupedByTargetDTO` để dùng cho các API list/search.
     * Mỗi nhóm gồm tên đối tượng bị báo cáo và các loại lỗi kèm số lần bị báo.
     */
    private List<ReportGroupedByTargetDTO> buildGroupedDTOList(List<UserReport> reports) {
        return reports.stream()
                .collect(Collectors.groupingBy(UserReport::getReportedId))
                .entrySet().stream()
                .flatMap(entry -> {
                    String targetId = entry.getKey();
                    List<UserReport> grouped = entry.getValue();
                    String name = resolveReportedName(targetId);
                    String email = userRepo.findById(targetId).map(User::getEmail).orElse("Ẩn");

                    Map<String, Long> typeCounts = grouped.stream()
                            .collect(Collectors.groupingBy(UserReport::getType, Collectors.counting()));

                    return typeCounts.entrySet().stream().map(e ->
                            new ReportGroupedByTargetDTO(
                                    targetId,
                                    name,
                                    email,
                                    e.getKey(),      // type
                                    e.getValue()     // count
                            )
                    );
                })
                .collect(Collectors.toList());
    }


    /**
     * Trả về chi tiết báo cáo của một đối tượng bị báo cáo (user hoặc vehicle).
     * Bao gồm:
     * - Thông tin tổng quan báo cáo (id, type)
     * - Thông tin người bị báo cáo (id, tên, email)
     * - Danh sách người báo cáo (id, tên, email, lý do, thời gian)
     */
    @Override
    public ReportDetailDTO getReportDetailByTargetAndType(String targetId, String type) {
        List<UserReport> allReports = reportRepo.findByReportedIdAndType(targetId, type);
        if (allReports.isEmpty()) return null;

        UserReport sample = allReports.get(0);

        List<UserReport> reports = allReports.stream()
                .filter(r -> r.getType().equals(type))
                .collect(Collectors.toList());

        //Thông tin báo cáo
        ReportSummaryDTO summary = new ReportSummaryDTO();
        summary.setReportId(sample.getId());
        summary.setType(sample.getType());

        //Thông tin người bị báo cáo
        ReportedUserDTO reportedUser = new ReportedUserDTO();
        reportedUser.setId(sample.getReportedId());
        reportedUser.setFullName(resolveReportedName(sample.getReportedId()));
        String email = userRepo.findById(sample.getReportedId())
                .map(User::getEmail)
                .orElse("Ẩn");
        reportedUser.setEmail(email);

        //List danh sách những người báo cao
        List<ReporterDetailDTO> reporterList = reports.stream().map(r -> {
            ReporterDetailDTO dto = new ReporterDetailDTO();
            dto.setId(r.getReporter().getId());
            dto.setFullName(r.getReporter().getFullName());
            dto.setEmail(r.getReporter().getEmail());
            dto.setReason(r.getReason());
            dto.setCreatedAt(r.getCreatedAt().toString());
            return dto;
        }).toList();

        ReportDetailDTO detail = new ReportDetailDTO();
        detail.setReportSummary(summary);
        detail.setReportedUser(reportedUser);
        detail.setReporters(reporterList);
        return detail;
    }
}
