package com.rft.rft_be.service.wallet;

import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.UpdateWalletRequestDTO;
import com.rft.rft_be.dto.wallet.WalletDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.entity.WalletTransaction;

import java.math.BigDecimal;
import java.util.List;

public interface WalletService {
    WalletDTO getWalletByUserId(String userId) ;
    WalletDTO updateWallet(UpdateWalletRequestDTO dto);
    void updateWalletBalance(String walletTransactionId, BigDecimal amount);

    List<WalletTransactionDTO> getWithdrawalsByUser(String userId);
    WalletTransactionDTO createWithdrawal(CreateWithdrawalRequestDTO dto);
    WalletTransactionDTO createTopUp(CreateWithdrawalRequestDTO dto);
    void cancelWithdrawal(String transactionId);

    List<WalletTransactionDTO> getAllWithdrawals(WalletTransaction.Status status);
    WalletTransactionDTO getWithdrawalById(String id);
    void updateWithdrawalStatus(String id, String status);
    void cancelWithdrawalAsUser(String transactionId, String userId);

}
