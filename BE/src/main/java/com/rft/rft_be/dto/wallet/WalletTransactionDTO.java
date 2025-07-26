package com.rft.rft_be.dto.wallet;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransactionDTO {
    private String id;
    private BigDecimal amount;
    private String status;
    private String userId;
    LocalDateTime createdAt;
}
