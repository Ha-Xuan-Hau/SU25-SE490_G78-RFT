package com.rft.rft_be.service.report;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserReport;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.ReportMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.UserReportRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.util.ProfanityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private final List<String> seriousReport = List.of(
            "DAMAGED_VEHICLE", "FRAUD", "MISLEADING_INFO", "OWNER_NO_SHOW",
            "OWNER_CANCEL_UNREASONABLY", "DOCUMENT_ISSUE", "TECHNICAL_ISSUE",
            "UNSAFE_VEHICLE", "FUEL_LEVEL_INCORRECT", "NO_INSURANCE",
            "EXPIRED_INSURANCE", "FAKE_DOCUMENT", "FAKE_ORDER",
            "DISPUTE_REFUND", "LATE_RETURN_NO_CONTACT"
    );

    //SPAM, INAPPROPRIATE - người
    //MISLEADING_LISTING - xe
    private final List<String> nonSeriousReport = List.of(
            "INAPPROPRIATE", "VIOLENCE", "SPAM", "OTHERS", "DIRTY_CAR", "MISLEADING_LISTING"
    );

    private final List<String> staffReport = List.of("STAFF_REPORT");
    private final List<String> appealReport = List.of("APPEAL");

    @Override
    public void report(User reporter, ReportRequest request) {
        String type = request.getType();

        if ("APPEAL".equals(type)) {
            processAppeal(reporter, request);
            return;
        }

        if ("STAFF_REPORT".equals(type)) {
            processStaffReport(reporter, request);
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

    private void processStaffReport(User staff, ReportRequest request) {
        request.setGeneralType("STAFF_ERROR");
        request.setType("STAFF_REPORT");

        // THÊM: Approve tất cả reports hiện tại của target
        String targetId = request.getTargetId();

        // Tìm tất cả reports NON_SERIOUS hoặc SERIOUS về target này
        List<UserReport> existingReports = reportRepo.findAll().stream()
                .filter(r -> r.getReportedId().equals(targetId))
                .filter(r -> nonSeriousReport.contains(r.getType()) || seriousReport.contains(r.getType()))
                .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                .collect(Collectors.toList());

        // Approve tất cả
        existingReports.forEach(report -> {
            report.setStatus(UserReport.Status.APPROVED);
        });
        reportRepo.saveAll(existingReports);

        // Tạo STAFF_REPORT
        UserReport staffFlag = reportMapper.toEntity(request);
        staffFlag.setReporter(staff);
        staffFlag.setCreatedAt(LocalDateTime.now());
        staffFlag.setStatus(UserReport.Status.PENDING);

        LocalDateTime deadline = LocalDateTime.now().plusHours(24);
        staffFlag.setReason(request.getReason() +
                "\n\n[Thời hạn kháng cáo: " +
                deadline.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) + "]");

        reportRepo.save(staffFlag);
    }


    private void processAppeal(User appellant, ReportRequest request) {
        String flagId = request.getOriginalReportId() != null ?
                request.getOriginalReportId() : request.getTargetId();

        UserReport flag = reportRepo.findById(flagId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo để kháng cáo"));

        if (!"STAFF_REPORT".equals(flag.getType()) || flag.getStatus() != UserReport.Status.PENDING) {
            throw new IllegalArgumentException("Báo cáo này không thể kháng cáo");
        }

        if (!flag.getReportedId().equals(appellant.getId())) {
            throw new IllegalArgumentException("Bạn không thể kháng cáo báo cáo này");
        }

        LocalDateTime deadline = flag.getCreatedAt().plusHours(24);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new IllegalArgumentException("Đã quá thời hạn kháng cáo (24 giờ)");
        }

        boolean hasAppealed = reportRepo.existsAppealByReporterAndFlag(appellant.getId(), flagId);
        if (hasAppealed) {
            throw new IllegalArgumentException("Bạn đã kháng cáo báo cáo này rồi");
        }

        request.setGeneralType("PROVIDER_APPEAL");
        request.setType("APPEAL");
        UserReport appeal = reportMapper.toEntity(request);
        appeal.setReporter(appellant);
        appeal.setReportedId(flagId);
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

        if (flagCount == 2) {
            // TODO: Gửi cảnh báo
            System.out.println("Warning: User " + userId + " has 2 flags");
        } else if (flagCount >= 3) {
            // TODO: Execute ban
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
        // Tìm tất cả reports của targetId với type cụ thể
        List<UserReport> reports = reportRepo.findByReportedIdAndType(targetId, type);

        if (reports.isEmpty()) {
            throw new RuntimeException("Không tìm thấy báo cáo");
        }

        // Chỉ xử lý NON_SERIOUS và SERIOUS
        if (!nonSeriousReport.contains(type) && !seriousReport.contains(type)) {
            throw new IllegalArgumentException("Không thể xử lý loại báo cáo này");
        }

        // Đổi tất cả sang REJECTED
        reports.forEach(report -> {
            if (report.getStatus() == UserReport.Status.PENDING) {
                report.setStatus(UserReport.Status.REJECTED);
            }
        });

        reportRepo.saveAll(reports);
    }

    @Override
    @Transactional
    public void rejectSeriousReports(String reportId) {
        // Tìm report theo ID
        UserReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo với ID: " + reportId));

        // Kiểm tra phải là SERIOUS report không
        if (!seriousReport.contains(report.getType())) {
            throw new IllegalArgumentException("Báo cáo này không phải loại nghiêm trọng");
        }

        // Kiểm tra status hiện tại
        if (report.getStatus() != UserReport.Status.PENDING) {
            throw new IllegalArgumentException("Báo cáo đã được xử lý trước đó");
        }

        // Lấy targetId và type từ report này
        String targetId = report.getReportedId();
        String type = report.getType();

        // Tìm TẤT CẢ reports cùng targetId và cùng type
        List<UserReport> allRelatedReports = reportRepo.findByReportedIdAndType(targetId, type);

        // Reject tất cả reports liên quan
        allRelatedReports.forEach(relatedReport -> {
            if (relatedReport.getStatus() == UserReport.Status.PENDING) {
                relatedReport.setStatus(UserReport.Status.REJECTED);
            }
        });

        // Lưu tất cả thay đổi
        reportRepo.saveAll(allRelatedReports);

        System.out.println("Đã reject " + allRelatedReports.size() + " báo cáo loại " + type + " của target: " + targetId);
    }


//    @Override
//    public List<ReportGroupedByTargetDTO> getEscalationTargets() {
//        List<Object[]> results = reportRepo.findEscalationTargets(nonSeriousReport, 10L);
//
//        return results.stream().map(row -> {
//            String targetId = (String) row[0];
//            long count = ((Number) row[1]).longValue();
//            return new ReportGroupedByTargetDTO(
//                    targetId,
//                    resolveReportedName(targetId),
//                    resolveReportedEmail(targetId),
//                    "ESCALATION_NEEDED",
//                    count
//            );
//        }).collect(Collectors.toList());
//    }

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

    @Override
    public ReportDetailDTO getReportDetailByTargetAndType(String targetId, String type) {
        //phân biệt đây là report xe hay report người

        List<UserReport> reports = reportRepo.findByReportedIdAndType(targetId, type);
        if (reports.isEmpty()) {
            return null;
        }

        UserReport sample = reports.get(0);

        ReportSummaryDTO summary = new ReportSummaryDTO();
        summary.setReportId(sample.getId());
        summary.setType(sample.getType());

        summary.setStatus(String.valueOf(sample.getStatus()));

        // THÊM: Xử lý đặc biệt cho STAFF_REPORT
        AppealInfoDTO appealInfo = null;

        if ("STAFF_REPORT".equals(type)) {
            UserReport staffFlag = reports.stream()
                    .filter(r -> r.getStatus() == UserReport.Status.PENDING)
                    .findFirst()
                    .orElse(sample); // Fallback to sample if no PENDING

            if (staffFlag != null) {
                LocalDateTime deadline = staffFlag.getCreatedAt().plusHours(24);
                summary.setAppealDeadline(deadline.toString());
                summary.setCanAppeal(LocalDateTime.now().isBefore(deadline) &&
                        staffFlag.getStatus() == UserReport.Status.PENDING);

                // Check có appeal không
                List<UserReport> appeals = reportRepo.findByReportedIdAndType(
                        staffFlag.getId(), "APPEAL");

                if (!appeals.isEmpty()) {
                    UserReport appeal = appeals.get(0); // Lấy appeal đầu tiên
                    summary.setHasAppealed(true);

                    // Tạo AppealInfoDTO
                    appealInfo = new AppealInfoDTO();
                    appealInfo.setAppealId(appeal.getId());
                    appealInfo.setAppellantName(appeal.getReporter().getFullName());
                    appealInfo.setAppellantEmail(appeal.getReporter().getEmail());
                    appealInfo.setReason(appeal.getReason());
                    appealInfo.setEvidenceUrl(appeal.getEvidenceUrl());
                    appealInfo.setCreatedAt(appeal.getCreatedAt().toString());
                    appealInfo.setStatus(appeal.getStatus().toString());
                }
            }

            // Đếm số cờ
            long flagCount = reportRepo.countByReportedIdAndTypeAndStatus(
                    targetId, "STAFF_REPORT", UserReport.Status.APPROVED);
            summary.setCurrentFlagCount(flagCount);
        }


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
                List<String> images = mapper.readValue(vehicle.getVehicleImages(), new TypeReference<List<String>>() {});
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

        List<ReporterDetailDTO> reporterList = reports.stream().map(r -> {
            ReporterDetailDTO dto = new ReporterDetailDTO();
            dto.setId(r.getReporter().getId());
            dto.setFullName(r.getReporter().getFullName());
            dto.setEmail(r.getReporter().getEmail());
            dto.setReason(r.getReason());
            dto.setEvidenceUrl(r.getEvidenceUrl());
            dto.setCreatedAt(r.getCreatedAt().toString());
            dto.setBooking(r.getBooking().getId());
            dto.setReportStatus(r.getStatus().toString());
            return dto;
        }).toList();

        ReportDetailDTO detail = new ReportDetailDTO();
        detail.setReportSummary(summary);
        detail.setReportedUser(reportedUser);
        detail.setReporters(reporterList);
        detail.setAppealInfo(appealInfo); //

        return detail;
    }

    private boolean matchGeneralType(String type, String generalType) {
        return ("SERIOUS_ERROR".equals(generalType) && seriousReport.contains(type))
                || ("NON_SERIOUS_ERROR".equals(generalType) && nonSeriousReport.contains(type))
                || ("STAFF_ERROR".equals(generalType) && staffReport.contains(type))
                || ("PROVIDER_APPEAL".equals(generalType) && appealReport.contains(type));
    }

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

                    return typeCounts.entrySet().stream().map(e
                                    -> new ReportGroupedByTargetDTO(
                                    targetId,
                                    name,
                                    email,
                                    e.getKey(),
                                    e.getValue()
                            )
                    );
                })
                .collect(Collectors.toList());
    }

    private String resolveReportedName(String targetId) {
        return userRepo.findById(targetId).map(User::getFullName)
                .orElse(vehicleRepo.findById(targetId).map(Vehicle::getLicensePlate).orElse("N/A"));
    }

    private String resolveReportedEmail(String targetId) {
        return userRepo.findById(targetId).map(User::getEmail).orElse("");
    }
}
