package com.rft.rft_be.dto.report;

import lombok.*;

import java.time.Duration;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaffReportDTO {
    private String id;
    private String reason;
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDateTime createdAt;
    private String reporterName; // Tên staff tạo report

    // Appeal info
    private LocalDateTime appealDeadline;
    private boolean canAppeal;
    private boolean hasAppealed;
    private String appealStatus; // Nếu có appeal
    private String appealReason;
    private String appealEvidenceUrl;

    // Flag count
    private long currentFlagCount;

    // Helper method cho FE
    public String getStatusDisplay() {
        if ("PENDING".equals(status)) {
            if (hasAppealed) {
                return "Đang chờ xử lý kháng cáo";
            } else if (canAppeal) {
                return "Chờ kháng cáo (còn " +
                        Duration.between(LocalDateTime.now(), appealDeadline).toHours() +
                        " giờ)";
            } else {
                return "Hết hạn kháng cáo";
            }
        } else if ("APPROVED".equals(status)) {
            return "Đã xác nhận vi phạm";
        } else {
            return "Đã hủy (kháng cáo thành công)";
        }
    }
}