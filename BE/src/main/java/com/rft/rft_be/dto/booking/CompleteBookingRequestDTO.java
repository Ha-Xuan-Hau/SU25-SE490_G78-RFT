package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CompleteBookingRequestDTO {

    private BigDecimal costSettlement;
    private String note;
}
