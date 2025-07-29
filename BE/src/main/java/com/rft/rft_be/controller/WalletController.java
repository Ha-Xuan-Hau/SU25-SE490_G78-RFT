package com.rft.rft_be.controller;
import com.rft.rft_be.dto.wallet.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Wallet;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.service.wallet.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Slf4j
public class WalletController {
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    @GetMapping("/account")
    public ResponseEntity<WalletDTO> getWallet(@RequestParam String userId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userIdToken = authentication.getToken().getClaim("userId");
        if(!userIdToken.trim().equals(userId.trim())){
            throw new AccessDeniedException("Bạn không có quyền truy cập tài nguyên này");
        }
        return ResponseEntity.ok(walletService.getWalletByUserId(userId));
    }

    @PutMapping("/account")
    public ResponseEntity<WalletDTO> updateWallet(@RequestBody UpdateWalletRequestDTO dto) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userIdToken = authentication.getToken().getClaim("userId");
        if(!userIdToken.trim().equals(dto.getUserId().trim())){
            throw new AccessDeniedException("Bạn không có quyền truy cập tài nguyên này");
        }
        return ResponseEntity.ok(walletService.updateWallet(dto));
    }

    @GetMapping("/withdrawals")
    @PreAuthorize("hasAnyAuthority('USER', 'PROVIDER')")
    public ResponseEntity<List<WalletTransactionDTO>> getWithdrawalsByUser(@RequestParam String userId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userIdToken = authentication.getToken().getClaim("userId");
        if(!userIdToken.equals(userId)){
            throw new AccessDeniedException("Bạn không có quyền truy cập tài nguyên này");
        }
        return ResponseEntity.ok(walletService.getWithdrawalsByUser(userId));
    }

    @PostMapping("/withdrawals")
    @PreAuthorize("hasAnyAuthority('USER', 'PROVIDER')")
    public ResponseEntity<?> createWithdrawal(@Valid @RequestBody CreateWithdrawalRequestDTO dto) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userIdToken = authentication.getToken().getClaim("userId");
        String staffId = authentication.getToken().getSubject();

        // Lấy ví để kiểm tra người sở hữu
        Wallet wallet = walletRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));

        if (!wallet.getUser().getId().equals(userIdToken)) {
            throw new AccessDeniedException("Bạn không có quyền tạo giao dịch từ ví này");
        }

        try {
            WalletTransactionDTO response = walletService.createWithdrawal(dto);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "statusCode", 400,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "statusCode", 500,
                    "message", "Đã xảy ra lỗi máy chủ"
            ));
        }
    }

    @PutMapping("/withdrawals/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('USER', 'PROVIDER')")
    public ResponseEntity<Void> cancelWithdrawal(@PathVariable String id,
                                                 @RequestParam String userId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userIdToken = authentication.getToken().getClaim("userId");
        walletService.cancelWithdrawalAsUser(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/staff/withdrawals")
    public ResponseEntity<List<WalletTransactionDTO>> getAllWithdrawals(@RequestParam WalletTransaction.Status status) {
        return ResponseEntity.ok(walletService.getAllWithdrawals(status));
    }

    @GetMapping("/staff/withdrawals/{id}")
    public ResponseEntity<WalletTransactionDTO> getWithdrawalDetail(@PathVariable String id) {
        return ResponseEntity.ok(walletService.getWithdrawalById(id));
    }

    @PutMapping("/staff/withdrawals/{id}/status")
    public ResponseEntity<Void> updateWithdrawalStatus(@PathVariable String id,
                                                       @RequestParam String status) {
        walletService.updateWithdrawalStatus(id, status);
        return ResponseEntity.ok().build();
    }

}

