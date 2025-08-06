package com.rft.rft_be.dto.report;

import lombok.*;

@Getter
@Setter
// Thông tin chi tiết của từng người báo cáo
public class ReporterDetailDTO {
    private String id;
    private String fullName;
    private String email;
    private String reason;
    private String createdAt;
}
