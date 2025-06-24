package com.rft.rft_be.dto.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateContractDTO {
    private String bookingId;
    private String userId;
    private String image;
    private String status; // DRAFT, FINISHED, CANCELLED
    private BigDecimal costSettlement;
}
