package com.rft.rft_be.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalDashboardResponse {
    // Số yêu cầu đang chờ xử lý (PENDING + PROCESSING)
    private long waitingCount;

    // Số yêu cầu đã xử lý thành công (APPROVED)
    private long approvedCount;

    // Tổng số tiền đã xử lý thành công trong khoảng thời gian (tuyệt đối VND)
    private BigDecimal totalApprovedAmount;
}
