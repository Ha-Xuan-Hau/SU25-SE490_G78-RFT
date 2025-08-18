package com.rft.rft_be.dto.admin;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyBookingSummaryResponse {
    long running;      // đơn đang chạy
    long completed;    // đơn hoàn thành
    long canceled;     // đơn đã hủy
    long total;         // tổng đơn
}
