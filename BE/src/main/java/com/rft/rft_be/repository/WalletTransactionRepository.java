package com.rft.rft_be.repository;

import com.rft.rft_be.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {
    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId);
    List<WalletTransaction> findByStatusOrderByCreatedAtDesc(String status);
}