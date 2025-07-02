package com.rft.rft_be.dto.penalty;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PenaltyDTO {
    private String id;
    private String userId;
    private String userName;
    private String penaltyType;
    private BigDecimal penaltyValue;
    private Integer minCancelHour;
    private String description;
}

