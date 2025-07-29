package com.rft.rft_be.dto.wallet;
import com.fasterxml.jackson.annotation.JsonFormat;
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
    private String walletId;
    private String fullName;
    private String email;
    private String cardNumber;
    private String bankName;
    private String cardHolderName;
    private BigDecimal amount;
    private String status;
    private String staffId;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime createdAt;
}
