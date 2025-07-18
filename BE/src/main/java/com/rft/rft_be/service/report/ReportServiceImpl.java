package com.rft.rft_be.service.report;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserReport;
import com.rft.rft_be.mapper.ReportMapper;
import com.rft.rft_be.repository.UserReportRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.util.ProfanityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final UserReportRepository reportRepo;
    private final UserRepository userRepo;
    private final ReportMapper mapper;

    @Override
    public void report(User reporter, ReportRequest request) {
        if (ProfanityValidator.containsProfanity(request.getReason())) {
            System.out.println("[PROFANITY] Nội dung report có từ ngữ không phù hợp: " + request.getReason());
        }

        UserReport report = mapper.toEntity(request);
        report.setReporter(reporter);
        report.setCreatedAt(LocalDateTime.now());
        reportRepo.save(report);

        if (!"VEHICLE_ERROR".equals(request.getType())) {
            List<UserReport> reports = reportRepo.findByReportedId(request.getTargetId());
            long seriousCount = reports.stream().filter(r -> "SERIOUS_ERROR".equals(r.getType())).count();
            long total = reports.size();

            if ("SERIOUS_ERROR".equals(request.getType())) {
                if (seriousCount >= 2 && seriousCount < 3) {
                    System.out.println("[WARNING] Bị báo cáo lỗi nghiêm trọng 2 lần: " + request.getTargetId());
                }
                if (seriousCount >= 3) {
                    userRepo.findById(request.getTargetId()).ifPresent(u -> {
                        u.setStatus(User.Status.INACTIVE);
                        userRepo.save(u);
                    });
                }
            } else {
                if (total >= 4 && total <= 5) {
                    System.out.println("[NOTICE] Bị report lỗi nhẹ nhiều lần: " + request.getTargetId());
                }
            }
        }
    }

    @Override
    public List<ReportDTO> getReportsByType(String type) {
        return reportRepo.findByTypeOrderByCreatedAtDesc(type)
                .stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @Override
    public ReportGroupedByTargetDTO getReportsSeparatedByTargetType() {
        List<UserReport> all = reportRepo.findAll();
        Map<String, Long> reportCountMap = all.stream()
                .collect(Collectors.groupingBy(UserReport::getReportedId, Collectors.counting()));

        List<ReportDTO> userReportsHigh = new ArrayList<>();
        List<ReportDTO> userReportsLow = new ArrayList<>();
        List<ReportDTO> vehicleReports = new ArrayList<>();

        for (UserReport r : all) {
            ReportDTO dto = mapper.toDto(r);
            String reportedId = r.getReportedId();
            long count = reportCountMap.getOrDefault(reportedId, 0L);

            boolean isUser = userRepo.existsById(reportedId);

            if (isUser) {
                if (count >= 4) {
                    userReportsHigh.add(dto); // đẩy lên đầu
                } else {
                    userReportsLow.add(dto); // sắp xếp theo ngày tạo
                }
            } else {
                vehicleReports.add(dto); // luôn theo ngày tạo mới nhất
            }
        }

        userReportsLow.sort(Comparator.comparing(ReportDTO::getCreatedAt).reversed());
        vehicleReports.sort(Comparator.comparing(ReportDTO::getCreatedAt).reversed());

        List<ReportDTO> finalUserReports = new ArrayList<>();
        finalUserReports.addAll(userReportsHigh); // Ưu tiên trước
        finalUserReports.addAll(userReportsLow);

        ReportGroupedByTargetDTO result = new ReportGroupedByTargetDTO();
        result.setUserReports(finalUserReports);
        result.setVehicleReports(vehicleReports);
        return result;
    }
    @Override
    public List<ReportDTO> searchUserReports(String keyword) {
        List<User> matchedUsers = userRepo.findAll().stream()
                .filter(u -> u.getFullName().toLowerCase().contains(keyword.toLowerCase()) || u.getEmail().toLowerCase().contains(keyword.toLowerCase()))
                .toList();

        List<String> userIds = matchedUsers.stream().map(User::getId).toList();

        return reportRepo.findByReportedIdIn(userIds).stream()
                .filter(r -> userRepo.existsById(r.getReportedId()))
                .map(mapper::toDto)
                .sorted(Comparator.comparing(ReportDTO::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportDTO> searchVehicleReports(String keyword) {
        return reportRepo.findAll().stream()
                .filter(r -> !userRepo.existsById(r.getReportedId()))
                .filter(r -> r.getReason().toLowerCase().contains(keyword.toLowerCase()) || r.getType().toLowerCase().contains(keyword.toLowerCase()))
                .map(mapper::toDto)
                .sorted(Comparator.comparing(ReportDTO::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }
}
