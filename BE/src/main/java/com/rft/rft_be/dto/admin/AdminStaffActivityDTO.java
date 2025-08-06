package com.rft.rft_be.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminStaffActivityDTO {
    private String action;        // "APPROVED_WITHDRAWAL", "APPROVED_FINAL_CONTRACT"
    private String targetId;      // ID của đơn rút tiền hoặc hợp đồng
    private String targetType;    // "WALLET_TRANSACTION", "FINAL_CONTRACT"
    private LocalDateTime time;   // createdAt hoặc updatedAt
}
