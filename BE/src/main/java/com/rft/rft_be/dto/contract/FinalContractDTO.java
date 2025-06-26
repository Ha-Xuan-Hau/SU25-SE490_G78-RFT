package com.rft.rft_be.dto.contract;


import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

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
    private Instant timeFinish;
    private BigDecimal costSettlement;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
