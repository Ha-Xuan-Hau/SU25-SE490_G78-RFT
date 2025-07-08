package com.rft.rft_be.dto.wallet;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletDTO {
    String id;
    String userId;
    BigDecimal balance;
    String bankAccountNumber;
    String bankAccountName;
    String bankAccountType;
}
