package com.rft.rft_be.dto.wallet;
import lombok.*;
import lombok.experimental.FieldDefaults;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateWalletRequestDTO {
    String userId;
    String bankAccountNumber;
    String bankAccountName;
    String bankAccountType;
}
