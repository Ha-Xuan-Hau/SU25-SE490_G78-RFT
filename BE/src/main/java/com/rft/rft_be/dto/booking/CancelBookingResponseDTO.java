package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelBookingResponseDTO {

    private String bookingId;
    private String status;
    private String contractStatus;
    private String finalContractId;
    private BigDecimal refundAmount;
    private BigDecimal penaltyAmount;
    private String reason;
    private String message;
}
