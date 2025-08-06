package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, String> {
    Optional<Wallet> findByUserId(String userId);
    
    // Admin methods
    @org.springframework.data.jpa.repository.Query("SELECT w.balance FROM Wallet w WHERE w.user.id = :userId")
    Double findBalanceByUserId(@org.springframework.data.repository.query.Param("userId") String userId);
    boolean existsByBankAccountNumberAndBankAccountType(String bankAccountNumber, String bankAccountType);

}