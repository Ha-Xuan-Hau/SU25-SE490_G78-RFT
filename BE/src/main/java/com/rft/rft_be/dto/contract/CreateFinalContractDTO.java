package com.rft.rft_be.dto.contract;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFinalContractDTO {
    private String contractId;
    private String userId;
    private String image;
    private LocalDateTime timeFinish;
    private BigDecimal costSettlement;
    private String note;
}