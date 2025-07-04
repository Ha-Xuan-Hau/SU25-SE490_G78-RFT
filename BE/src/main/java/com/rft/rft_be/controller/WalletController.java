package com.rft.rft_be.controller;
import com.rft.rft_be.dto.wallet.*;
import com.rft.rft_be.service.wallet.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {
    private final WalletService walletService;

    @GetMapping("/account")
    public ResponseEntity<WalletDTO> getWallet(@RequestParam String userId) {
        return ResponseEntity.ok(walletService.getWalletByUserId(userId));
    }

    @PutMapping("/account")
    public ResponseEntity<WalletDTO> updateWallet(@RequestBody UpdateWalletRequestDTO dto) {
        return ResponseEntity.ok(walletService.updateWallet(dto));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<List<WalletTransactionDTO>> getWithdrawalsByUser(@RequestParam String userId) {
        return ResponseEntity.ok(walletService.getWithdrawalsByUser(userId));
    }

    @PostMapping("/withdrawals")
    public ResponseEntity<WalletTransactionDTO> createWithdrawal(@RequestBody CreateWithdrawalRequestDTO dto) {
        return ResponseEntity.ok(walletService.createWithdrawal(dto));
    }

    @PutMapping("/withdrawals/{id}/cancel")
    public ResponseEntity<Void> cancelWithdrawal(@PathVariable String id) {
        walletService.cancelWithdrawal(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/staff/withdrawals")
    public ResponseEntity<List<WalletTransactionDTO>> getAllWithdrawals(@RequestParam String status) {
        return ResponseEntity.ok(walletService.getAllWithdrawals(status));
    }

    @GetMapping("/staff/withdrawals/{id}")
    public ResponseEntity<WalletTransactionDTO> getWithdrawalDetail(@PathVariable String id) {
        return ResponseEntity.ok(walletService.getWithdrawalById(id));
    }

    @PutMapping("/staff/withdrawals/{id}/status")
    public ResponseEntity<Void> updateWithdrawalStatus(
            @PathVariable String id,
            @RequestParam String status) {
        walletService.updateWithdrawalStatus(id, status);
        return ResponseEntity.ok().build();
    }
}
