package com.rft.rft_be.dto.report;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO dùng để nhận yêu cầu gửi báo cáo từ phía người dùng
public class ReportRequest {
    @NotBlank
    private String targetId; // userId hoặc vehicleId

    @NotBlank
    private String generalType;

    @NotBlank
    private String type;

    private  String booking;

    private String evidenceUrl;

    @NotBlank
    private String reason;
}
