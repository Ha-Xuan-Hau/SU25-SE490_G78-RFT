package com.rft.rft_be.dto.report;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReportDTO {
    private String id;
    private String reporterId;
    private String targetId; // sẽ là userId hoặc vehicleId tuỳ loại report
    private String type;
    private String reason;
    private LocalDateTime createdAt;

}
