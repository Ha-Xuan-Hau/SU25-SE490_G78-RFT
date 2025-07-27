package com.rft.rft_be.dto.finalcontract;


import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalContractDTO {
    private String id;
    private String contractId;
    private String userId;
    private String userName;
    private String image;
    private LocalDateTime timeFinish;
    private BigDecimal costSettlement;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String contractStatus;
    
    // Provider information
    private String providerId;
    private String providerName;
    private String providerEmail;
    private String providerPhone;
}
