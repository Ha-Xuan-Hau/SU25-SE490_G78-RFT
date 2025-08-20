package com.rft.rft_be.dto.admin;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponItemDTO {
    private String id;
    private String name;              // chính là “code”
    private BigDecimal discount;      // % hoặc số tiền
    private String description;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timeExpired;
    private String status;            // VALID | EXPIRED
    private Long daysLeft;            // số ngày còn lại (>=0), null nếu đã hết hạn/không có HSD
}
