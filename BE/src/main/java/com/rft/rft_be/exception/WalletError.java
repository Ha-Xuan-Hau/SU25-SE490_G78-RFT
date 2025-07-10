package com.rft.rft_be.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum WalletError {

    WALLET_NOT_FOUND("Không tìm thấy ví"),
    TRANSACTION_NOT_FOUND("Không tìm thấy giao dịch"),
    INSUFFICIENT_BALANCE("Số dư không đủ"),
    ONLY_PENDING_CAN_BE_CANCELLED("Chỉ giao dịch ở trạng thái PENDING mới được hủy");

    private final String message;
}
