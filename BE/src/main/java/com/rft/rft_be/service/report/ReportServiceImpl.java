package com.rft.rft_be.service.report;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.admin.ReportDashboardResponse;
import com.rft.rft_be.dto.admin.ReportStatisticDTO;
import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.ReportMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.UserReportRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.Notification.NotificationService;
import com.rft.rft_be.service.admin.AdminUserService;
import com.rft.rft_be.service.mail.EmailSenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final BookingRepository bookingRepository;
    private final AdminUserService adminUserService;
    private final NotificationService notificationService;

    private final List<String> seriousReport = List.of(
            "DAMAGED_VEHICLE", "FRAUD", "MISLEADING_INFO", "OWNER_NO_SHOW",
            "OWNER_CANCEL_UNREASONABLY", "DOCUMENT_ISSUE", "TECHNICAL_ISSUE",
            "UNSAFE_VEHICLE", "FUEL_LEVEL_INCORRECT", "NO_INSURANCE",
            "EXPIRED_INSURANCE", "FAKE_DOCUMENT", "FAKE_ORDER",
            "DISPUTE_REFUND", "LATE_RETURN_NO_CONTACT"
    );

    private final List<String> nonSeriousReport = List.of(
            "INAPPROPRIATE", "VIOLENCE", "SPAM", "OTHERS", "DIRTY_CAR", "MISLEADING_LISTING"
    );

    private final List<String> staffReport = List.of("STAFF_REPORT");
    private final UserRepository userRepository;

    @Override
    public void report(User reporter, ReportRequest request) {
        String type = request.getType();

        if ("APPEAL".equals(type)) {
            processAppeal(reporter, request);
            return;
        }

        // Logic cho các report thông thường
        if (seriousReport.contains(type)) {
            request.setGeneralType("SERIOUS_ERROR");
        } else if (nonSeriousReport.contains(type)) {
            request.setGeneralType("NON_SERIOUS_ERROR");
        } else {
            request.setGeneralType("NON_SERIOUS_ERROR");
        }

        UserReport report = reportMapper.toEntity(request);
        report.setReporter(reporter);
        report.setCreatedAt(LocalDateTime.now());
        report.setStatus(UserReport.Status.PENDING);

        if (request.getBooking() != null && !request.getBooking().isEmpty()) {
            Booking booking = bookingRepository.findById(request.getBooking())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));
            report.setBooking(booking);
        }

        reportRepo.save(report);
    }


    private void processAppeal(User appellant, ReportRequest request) {
        // targetId hoặc originalReportId là ID của STAFF_REPORT cần kháng cáo
        String flagId = request.getOriginalReportId() != null ?
                request.getOriginalReportId() : request.getTargetId();

        UserReport flag = reportRepo.findById(flagId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo để kháng cáo"));

        if (!"STAFF_REPORT".equals(flag.getType()) || flag.getStatus() != UserReport.Status.PENDING) {
            throw new IllegalArgumentException("Báo cáo này không thể kháng cáo");
        }

        // Cần check appellant.getId() == flag.getReportedId()
        if (!flag.getReportedId().equals(appellant.getId())) {
            throw new IllegalArgumentException("Bạn không thể kháng cáo báo cáo này");
        }

        LocalDateTime deadline = flag.getCreatedAt().plusHours(24);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new IllegalArgumentException("Đã quá thời hạn kháng cáo (24 giờ)");
        }

        // Check đã appeal chưa
        boolean hasAppealed = reportRepo.findAll().stream()
                .anyMatch(r -> "APPEAL".equals(r.getType())
                        && r.getReporter().getId().equals(appellant.getId())
                        && r.getReportedId().equals(flagId));

        if (hasAppealed) {
            throw new IllegalArgumentException("Bạn đã kháng cáo báo cáo này rồi");
        }

        // Tạo APPEAL
        request.setType("APPEAL");
        UserReport appeal = reportMapper.toEntity(request);
        appeal.setReporter(appellant);
        appeal.setReportedId(flagId); // reportedId của APPEAL = ID của STAFF_REPORT
        appeal.setCreatedAt(LocalDateTime.now());
        appeal.setStatus(UserReport.Status.PENDING);

        reportRepo.save(appeal);
    }


    @Transactional
    @Override
    public void processAppealDecision(String appealId, boolean approved) {
        UserReport appeal = reportRepo.findById(appealId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kháng cáo"));

        if (!"APPEAL".equals(appeal.getType())) {
            throw new IllegalArgumentException("Đây không phải là kháng cáo");
        }

        appeal.setStatus(approved ? UserReport.Status.APPROVED : UserReport.Status.REJECTED);
        reportRepo.save(appeal);

        String flagId = appeal.getReportedId();
        UserReport flag = reportRepo.findById(flagId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy flag gốc"));

        if (approved) {
            flag.setStatus(UserReport.Status.REJECTED);
        } else {
            flag.setStatus(UserReport.Status.APPROVED);
            checkAndExecuteBan(flag.getReportedId());
        }

        reportRepo.save(flag);
    }

    private void checkAndExecuteBan(String userId) {
        long flagCount = reportRepo.countByReportedIdAndTypeAndStatus(
                userId, "STAFF_REPORT", UserReport.Status.APPROVED);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (flagCount == 2) {
            // TODO: Gửi cảnh báo
            notificationService.notifyUserWarningTwoFlags(userId, 2);
            System.out.println("Warning: User " + userId + " has 2 flags");
        } else if (flagCount >= 3) {
            // TODO: Execute ban
            adminUserService.banUser(userId);
            System.out.println("Ban: User " + userId + " has 3 flags");
        }
    }

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void autoApproveExpiredFlags() {
        LocalDateTime deadline = LocalDateTime.now().minusHours(24);
        List<UserReport> expiredFlags = reportRepo.findByTypeAndStatusAndCreatedAtBefore(
                "STAFF_REPORT", UserReport.Status.PENDING, deadline);

        for (UserReport flag : expiredFlags) {
            boolean hasAppeal = reportRepo.existsAppealByReporterAndFlag(
                    flag.getReportedId(), flag.getId());

            if (!hasAppeal) {
                flag.setStatus(UserReport.Status.APPROVED);
                reportRepo.save(flag);
                checkAndExecuteBan(flag.getReportedId());
            }
        }
    }

    @Override
    @Transactional
    public void rejectAllReports(String targetId, String type) {
        List<UserReport> reports = reportRepo.findByReportedIdAndType(targetId, type);

        if (reports.isEmpty()) {
            throw new RuntimeException("Không tìm thấy báo cáo");
        }

        if (!nonSeriousReport.contains(type) && !seriousReport.contains(type)) {
            throw new IllegalArgumentException("Không thể xử lý loại báo cáo này");
        }

        reports.forEach(report -> {
            if (report.getStatus() == UserReport.Status.PENDING) {
                report.setStatus(UserReport.Status.REJECTED);
            }
        });

        reportRepo.saveAll(reports);
    }

    @Override
    @Transactional
    public void rejectSingleReport(String reportId) {
        UserReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));

        if (!seriousReport.contains(report.getType()) &&
                !"STAFF_REPORT".equals(report.getType())) {
            throw new IllegalArgumentException("Method này chỉ dùng cho SERIOUS/STAFF reports");
        }

        if (report.getStatus() != UserReport.Status.PENDING) {
            throw new IllegalArgumentException("Báo cáo đã được xử lý");
        }

        report.setStatus(UserReport.Status.APPROVED);
        reportRepo.save(report);
    }

    @Override
    @Transactional
    public void approveAllReports(String targetId, String type) {
        List<UserReport> reports = reportRepo.findByReportedIdAndType(targetId, type).stream()
                .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                .collect(Collectors.toList());

        if (reports.isEmpty()) {
            throw new RuntimeException("Không tìm thấy báo cáo PENDING để approve");
        }

        if (!nonSeriousReport.contains(type)) {
            throw new IllegalArgumentException("Method này chỉ dùng cho NON_SERIOUS reports");
        }

        reports.forEach(report -> report.setStatus(UserReport.Status.APPROVED));
        reportRepo.saveAll(reports);

    }

    @Override
    @Transactional
    public void approveSingleReport(String reportId) {
        UserReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo: " + reportId));

        if (!seriousReport.contains(report.getType())) {
            throw new IllegalArgumentException("Method này chỉ dùng cho SERIOUS reports");
        }

        if (report.getStatus() != UserReport.Status.PENDING) {
            throw new IllegalArgumentException("Báo cáo đã được xử lý trước đó");
        }

        report.setStatus(UserReport.Status.APPROVED);
        reportRepo.save(report);
    }

    @Override
    @Transactional
    public String createStaffReport(User staff, ReportRequest request) {
        request.setGeneralType("STAFF_ERROR");
        request.setType("STAFF_REPORT");

        UserReport staffFlag = reportMapper.toEntity(request);
        staffFlag.setReporter(staff);
        staffFlag.setCreatedAt(LocalDateTime.now());
        staffFlag.setStatus(UserReport.Status.PENDING);

        LocalDateTime deadline = LocalDateTime.now().plusHours(24);
        staffFlag.setReason(request.getReason() +
                "\n\n[Thời hạn kháng cáo: " +
                deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) + "]");

        UserReport saved = reportRepo.save(staffFlag);


        // TODO: Send notification to user
        String reportUrl = "/report-detail?reportId=" + saved.getId() + "&mode=single";
        notificationService.notifyUserBeingReportedByStaff(request.getTargetId(), reportUrl);
        String userBanId = request.getTargetId();
        long flagCount = reportRepo.countByReportedIdAndTypeAndStatus(
                userBanId, "STAFF_REPORT", UserReport.Status.APPROVED);
        if (flagCount >= 3) {
            notificationService.notifyUserTemporaryBan(userBanId);
        }
        return saved.getId();
    }

    @Override
    public UserReport getReportById(String reportId) {
        return reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
    }

    @Override
    public List<ReportGroupedByTargetDTO> getReportsByType(String generalType, int page, int size) {
        List<ReportGroupedByTargetDTO> result = new ArrayList<>();

        if ("NON_SERIOUS_ERROR".equals(generalType)) {
            result = getNonSeriousReports();
        } else if ("SERIOUS_ERROR".equals(generalType)) {
            result = getSeriousReports();
        } else if ("STAFF_ERROR".equals(generalType)) {
            result = getStaffReports();
        }
        // Không xử lý APPEAL vì không hiển thị trên UI

        // Sort by count (descending) then by created date
        result.sort(Comparator
                .comparingLong(ReportGroupedByTargetDTO::getCount).reversed());

        return paginate(result, page, size);
    }

    // Xử lý NON_SERIOUS - nhóm theo targetId và type
    private List<ReportGroupedByTargetDTO> getNonSeriousReports() {
        // Lấy tất cả reports NON_SERIOUS với status PENDING
        List<UserReport> pendingReports = reportRepo.findAll().stream()
                .filter(r -> nonSeriousReport.contains(r.getType()))
                .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                .collect(Collectors.toList());

        // Group by targetId và type
        Map<String, Map<String, List<UserReport>>> groupedByTargetAndType = pendingReports.stream()
                .collect(Collectors.groupingBy(
                        UserReport::getReportedId,
                        Collectors.groupingBy(UserReport::getType)
                ));

        List<ReportGroupedByTargetDTO> result = new ArrayList<>();

        groupedByTargetAndType.forEach((targetId, typeMap) -> {
            typeMap.forEach((type, reports) -> {
                ReportGroupedByTargetDTO dto = new ReportGroupedByTargetDTO();
                dto.setTargetId(targetId);
                dto.setReportId(null); // NON_SERIOUS không cần reportId
                dto.setReportedNameOrVehicle(resolveReportedName(targetId));
                dto.setEmail(resolveReportedEmail(targetId));
                dto.setType(type);
                dto.setCount((long) reports.size());
                result.add(dto);
            });
        });

        return result;
    }

    // Xử lý SERIOUS - mỗi report là 1 item riêng
    private List<ReportGroupedByTargetDTO> getSeriousReports() {
        List<UserReport> reports = reportRepo.findAll().stream()
                .filter(r -> seriousReport.contains(r.getType()))
                .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                .collect(Collectors.toList());

        return reports.stream().map(report -> {
            ReportGroupedByTargetDTO dto = new ReportGroupedByTargetDTO();
            dto.setTargetId(report.getReportedId());
            dto.setReportId(report.getId()); // SERIOUS cần reportId
            dto.setReportedNameOrVehicle(resolveReportedName(report.getReportedId()));
            dto.setEmail(resolveReportedEmail(report.getReportedId()));
            dto.setType(report.getType());
            dto.setCount(1L); // SERIOUS luôn có count = 1
            return dto;
        }).collect(Collectors.toList());
    }

    // Xử lý STAFF_REPORT - mỗi report là 1 item riêng
    private List<ReportGroupedByTargetDTO> getStaffReports() {
        List<UserReport> reports = reportRepo.findAll().stream()
                .filter(r -> "STAFF_REPORT".equals(r.getType()))
                .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                .collect(Collectors.toList());

        return reports.stream().map(report -> {
            ReportGroupedByTargetDTO dto = new ReportGroupedByTargetDTO();
            dto.setTargetId(report.getReportedId());
            dto.setReportId(report.getId()); // STAFF_REPORT cần reportId
            dto.setReportedNameOrVehicle(resolveReportedName(report.getReportedId()));
            dto.setEmail(resolveReportedEmail(report.getReportedId()));
            dto.setType("STAFF_REPORT");
            dto.setCount(1L);

            // Thêm thông tin appeal status
            LocalDateTime deadline = report.getCreatedAt().plusHours(24);
            boolean hasAppeal = reportRepo.existsAppealByReporterAndFlag(
                    report.getReportedId(), report.getId()
            );

            String additionalInfo = "";
            if (hasAppeal) {
                additionalInfo = " (Đã có kháng cáo)";
            } else if (LocalDateTime.now().isAfter(deadline)) {
                additionalInfo = " (Hết hạn kháng cáo)";
            } else {
                long hoursLeft = Duration.between(LocalDateTime.now(), deadline).toHours();
                additionalInfo = " (Còn " + hoursLeft + "h để kháng cáo)";
            }
            dto.setAdditionalInfo(additionalInfo);

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ReportGroupedByTargetDTO> searchReports(String generalType, String keyword, String type, int page, int size) {
        List<ReportGroupedByTargetDTO> allReports = getReportsByType(generalType, 0, Integer.MAX_VALUE);

        // Filter by keyword and type
        List<ReportGroupedByTargetDTO> filtered = allReports.stream()
                .filter(r -> keyword == null || keyword.isEmpty() ||
                        r.getReportedNameOrVehicle().toLowerCase().contains(keyword.toLowerCase()) ||
                        r.getEmail().toLowerCase().contains(keyword.toLowerCase()))
                .filter(r -> type == null || type.isEmpty() || r.getType().equalsIgnoreCase(type))
                .collect(Collectors.toList());

        return paginate(filtered, page, size);
    }

    @Override
    public ReportDetailDTO getGroupedReportDetail(String targetId, String type) {
        if (!nonSeriousReport.contains(type)) {
            throw new IllegalArgumentException("This endpoint only supports non-serious report types");
        }

        // LẤY TẤT CẢ reports, không chỉ PENDING
        List<UserReport> reports = reportRepo.findByReportedIdAndType(targetId, type);

        if (reports.isEmpty()) {
            return null;
        }

        // Thêm flag để biết đã xử lý chưa
        boolean hasProcessed = reports.stream()
                .anyMatch(r -> r.getStatus() != UserReport.Status.PENDING);

        return buildReportDetailDTO(reports, targetId, hasProcessed);
    }

    @Override
    public ReportDetailDTO getSingleReportDetail(String reportId) {
        UserReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));

        if (!seriousReport.contains(report.getType()) && !"STAFF_REPORT".equals(report.getType())) {
            throw new IllegalArgumentException("This endpoint only supports serious or staff report types");
        }

//        if (report.getStatus() != UserReport.Status.PENDING) {
//            throw new IllegalArgumentException("Report is not in PENDING status");
//        }

        List<UserReport> singleReportList = List.of(report);

        boolean hasProcessed = report.getStatus() != UserReport.Status.PENDING;

        return buildReportDetailDTO(singleReportList, report.getReportedId(), hasProcessed);
    }

    private ReportDetailDTO buildReportDetailDTO(List<UserReport> reports, String targetId,boolean hasProcessed) {
        if (reports.isEmpty()) {
            return null;
        }

        UserReport sample = reports.get(0);

        ReportSummaryDTO summary = new ReportSummaryDTO();
        summary.setReportId(sample.getId());
        summary.setType(sample.getType());
        summary.setStatus(String.valueOf(sample.getStatus()));
        summary.setHasProcessed(hasProcessed);


        AppealInfoDTO appealInfo = null;
        if ("STAFF_REPORT".equals(sample.getType())) {
            appealInfo = buildAppealInfo(sample, targetId, summary);
        }

        ReportedUserDTO reportedUser = buildReportedUserDTO(targetId);

        List<ReporterDetailDTO> reporterList = reports.stream()
                .map(this::buildReporterDetailDTO)
                .collect(Collectors.toList());

        ReportDetailDTO detail = new ReportDetailDTO();
        detail.setReportSummary(summary);
        detail.setReportedUser(reportedUser);
        detail.setReporters(reporterList);
        detail.setAppealInfo(appealInfo);

        return detail;
    }

    private AppealInfoDTO buildAppealInfo(UserReport staffFlag, String targetId, ReportSummaryDTO summary) {
        LocalDateTime deadline = staffFlag.getCreatedAt().plusHours(24);
        summary.setAppealDeadline(deadline.toString());
        summary.setCanAppeal(LocalDateTime.now().isBefore(deadline) &&
                staffFlag.getStatus() == UserReport.Status.PENDING);

        List<UserReport> appeals = reportRepo.findByReportedIdAndType(staffFlag.getId(), "APPEAL");

        AppealInfoDTO appealInfo = null;
        if (!appeals.isEmpty()) {
            UserReport appeal = appeals.get(0);
            summary.setHasAppealed(true);

            appealInfo = new AppealInfoDTO();
            appealInfo.setAppealId(appeal.getId());
            appealInfo.setAppellantName(appeal.getReporter().getFullName());
            appealInfo.setAppellantEmail(appeal.getReporter().getEmail());
            appealInfo.setReason(appeal.getReason());
            appealInfo.setEvidenceUrl(appeal.getEvidenceUrl());
            appealInfo.setCreatedAt(appeal.getCreatedAt().toString());
            appealInfo.setStatus(appeal.getStatus().toString());
        }

        long flagCount = reportRepo.countByReportedIdAndTypeAndStatus(
                targetId, "STAFF_REPORT", UserReport.Status.APPROVED);
        summary.setCurrentFlagCount(flagCount);

        return appealInfo;
    }

    private ReporterDetailDTO buildReporterDetailDTO(UserReport report) {
        ReporterDetailDTO dto = new ReporterDetailDTO();
        dto.setId(report.getReporter().getId());
        dto.setFullName(report.getReporter().getFullName());
        dto.setEmail(report.getReporter().getEmail());
        dto.setReason(report.getReason());
        dto.setEvidenceUrl(report.getEvidenceUrl());
        dto.setCreatedAt(report.getCreatedAt().toString());
        dto.setReportStatus(report.getStatus().toString());
        if(report.getBooking() != null) {
            dto.setBooking(report.getBooking().getId());
        }
        return dto;
    }

    private ReportedUserDTO buildReportedUserDTO(String targetId) {
        ReportedUserDTO reportedUser = new ReportedUserDTO();

        Optional<User> userOpt = userRepo.findById(targetId);
        Optional<Vehicle> vehicleOpt = vehicleRepo.findById(targetId);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            reportedUser.setId(user.getId());
            reportedUser.setFullName(user.getFullName());
            reportedUser.setEmail(user.getEmail());
        } else if (vehicleOpt.isPresent()) {
            Vehicle vehicle = vehicleOpt.get();
            reportedUser.setVehicleId(vehicle.getId());
            reportedUser.setVehicleName(vehicle.getThumb());

            try {
                ObjectMapper mapper = new ObjectMapper();
                List<String> images = mapper.readValue(vehicle.getVehicleImages(),
                        new TypeReference<List<String>>() {});
                if (!images.isEmpty()) {
                    reportedUser.setVehicleImage(images.get(0));
                }
            } catch (Exception e) {
                reportedUser.setVehicleImage(null);
            }

            User owner = vehicle.getUser();
            if (owner != null) {
                reportedUser.setId(owner.getId());
                reportedUser.setFullName(owner.getFullName());
                reportedUser.setEmail(owner.getEmail());
            }
        } else {
            reportedUser.setId(targetId);
            reportedUser.setFullName("Đối tượng không tồn tại");
            reportedUser.setEmail("N/A");
        }

        return reportedUser;
    }

    private String resolveReportedName(String targetId) {
        return userRepo.findById(targetId).map(User::getFullName)
                .orElse(vehicleRepo.findById(targetId).map(Vehicle::getLicensePlate).orElse("N/A"));
    }

    private String resolveReportedEmail(String targetId) {
        Optional<User> userOpt = userRepo.findById(targetId);
        if (userOpt.isPresent()) {
            return userOpt.get().getEmail();
        }

        Optional<Vehicle> vehicleOpt = vehicleRepo.findById(targetId);
        if (vehicleOpt.isPresent() && vehicleOpt.get().getUser() != null) {
            return vehicleOpt.get().getUser().getEmail();
        }

        return "";
    }

    //Report write detail by target and type
    @Override
    @Deprecated
    public ReportDetailDTO getReportDetailByTargetAndType(String targetId, String type) {
        // Redirect to appropriate method based on type
        if (nonSeriousReport.contains(type)) {
            return getGroupedReportDetail(targetId, type);
        } else if (seriousReport.contains(type) || "STAFF_REPORT".equals(type)) {
            // For backward compatibility, need to find the report ID first
            List<UserReport> reports = reportRepo.findByReportedIdAndType(targetId, type).stream()
                    .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                    .findFirst()
                    .map(List::of)
                    .orElse(Collections.emptyList());

            if (reports.isEmpty()) {
                return null;
            }

            return getSingleReportDetail(reports.get(0).getId());
        }

        return null;
    }

    private boolean matchGeneralType(String type, String generalType) {
        return ("SERIOUS_ERROR".equals(generalType) && seriousReport.contains(type))
                || ("NON_SERIOUS_ERROR".equals(generalType) && nonSeriousReport.contains(type))
                || ("STAFF_ERROR".equals(generalType) && "STAFF_REPORT".equals(type));
        // Không check APPEAL vì không hiển thị trên UI
    }
    //show report total on dashboard
    @Override
    public ReportDashboardResponse getDashboardReportStatistics(LocalDateTime from, LocalDateTime to) {
        // Gộp type của cả 2 nhóm
        List<String> allTypes = new ArrayList<>();
        allTypes.addAll(nonSeriousReport);
        allTypes.addAll(seriousReport);

        long pendingAll = reportRepo.countByTypesAndStatusAndDateRange(
                allTypes, UserReport.Status.PENDING, from, to);
        ReportDashboardResponse response = new ReportDashboardResponse();
        response.setPendingTotal(pendingAll);
        response.setNonSerious(buildStats(nonSeriousReport, from, to));
        response.setSerious(buildStats(seriousReport, from, to));
        return response;
    }

    private ReportStatisticDTO buildStats(List<String> types, LocalDateTime from, LocalDateTime to) {
        long total = reportRepo.countByTypesAndDateRange(types, from, to);
        long pending = reportRepo.countByTypesAndStatusAndDateRange(types, UserReport.Status.PENDING, from, to);
        long processed = total - pending;

        ReportStatisticDTO dto = new ReportStatisticDTO();
        dto.setTotal(total);
        dto.setPending(pending);
        dto.setProcessed(processed);
        return dto;
    }
}
