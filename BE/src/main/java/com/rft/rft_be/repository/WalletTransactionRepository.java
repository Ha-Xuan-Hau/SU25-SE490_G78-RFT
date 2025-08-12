package com.rft.rft_be.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rft.rft_be.entity.WalletTransaction;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<WalletTransaction> findByStatus(WalletTransaction.Status status);

    List<WalletTransaction> findByStatusAndUserIdNotNull(WalletTransaction.Status status);

    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(String walletId);
}
