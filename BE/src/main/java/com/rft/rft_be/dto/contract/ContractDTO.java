package com.rft.rft_be.dto.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractDTO {
    private String id;
    private String bookingId;
    private String userId;
    private String userName;
    private String image;
    private String status;
    private BigDecimal costSettlement;
    private Instant createdAt;
    private Instant updatedAt;
}
