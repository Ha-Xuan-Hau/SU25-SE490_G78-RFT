package com.rft.rft_be.dto.report;

import lombok.*;

@Getter
@Setter
// Thông tin người hoặc xe bị báo cáo
public class ReportedUserDTO {
    private String id;
    private String fullName;
    private String email;
}
