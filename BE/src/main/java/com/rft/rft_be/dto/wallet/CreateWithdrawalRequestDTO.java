package com.rft.rft_be.dto.wallet;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateWithdrawalRequestDTO {
    String userId;
    BigDecimal amount;
}
