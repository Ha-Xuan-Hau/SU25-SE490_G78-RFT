package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CompleteBookingRequestDTO {
    private LocalDateTime timeFinish;
    private BigDecimal costSettlement;
    private String note;
}
