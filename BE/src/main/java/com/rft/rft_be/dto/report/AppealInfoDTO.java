package com.rft.rft_be.dto.report;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AppealInfoDTO {
    private String appealId;
    private String appellantName;  // Tên người kháng cáo
    private String appellantEmail;
    private String reason;
    private String evidenceUrl;
    private String createdAt;
    private String status; // PENDING, APPROVED, REJECTED
}
