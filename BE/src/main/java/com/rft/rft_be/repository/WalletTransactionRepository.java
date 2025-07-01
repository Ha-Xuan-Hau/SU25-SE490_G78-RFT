package com.rft.rft_be.repository;

import com.rft.rft_be.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {
}