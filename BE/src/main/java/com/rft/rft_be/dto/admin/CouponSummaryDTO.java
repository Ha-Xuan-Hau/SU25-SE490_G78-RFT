package com.rft.rft_be.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponSummaryDTO {
    private long activeCount;         // VALID
    private long expiredCount;        // EXPIRED
    private long totalCount;          // = active + expired
}
