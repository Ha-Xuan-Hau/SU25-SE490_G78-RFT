package com.rft.rft_be.dto.finalcontract;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalContractResponseDTO {
    private String id;
    private String bookingId;
    private String renterName;
    private String vehicleOwnerName;
    private BigDecimal costSettlement;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}