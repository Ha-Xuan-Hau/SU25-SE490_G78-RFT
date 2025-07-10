package com.rft.rft_be.dto.wallet;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateWithdrawalRequestDTO {

    String userId;
    @NotNull(message = "Số tiền không được bỏ trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    BigDecimal amount;
}
