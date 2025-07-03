package com.rft.rft_be.service.wallet;

import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.UpdateWalletRequestDTO;
import com.rft.rft_be.dto.wallet.WalletDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;

import java.util.List;

public interface WalletService {
    WalletDTO getWalletByUserId(String userId) ;
    WalletDTO updateWallet(UpdateWalletRequestDTO dto);

    List<WalletTransactionDTO> getWithdrawalsByUser(String userId);
    WalletTransactionDTO createWithdrawal(CreateWithdrawalRequestDTO dto);
    void cancelWithdrawal(String transactionId);

    List<WalletTransactionDTO> getAllWithdrawals(String status);
    WalletTransactionDTO getWithdrawalById(String id);
    void updateWithdrawalStatus(String id, String status);
}
