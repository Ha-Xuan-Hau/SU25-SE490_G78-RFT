package com.rft.rft_be.service;

import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Wallet;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.mapper.WalletMapper;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.repository.WalletTransactionRepository;
import com.rft.rft_be.service.wallet.WalletServiceImpl;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import static com.rft.rft_be.exception.WalletError.*;
import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class WithdrawServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletMapper walletMapper;

    @InjectMocks
    private WalletServiceImpl walletService;

    private CreateWithdrawalRequestDTO requestDTO;
    private Wallet wallet;
    private WalletTransaction transaction;
    private WalletTransactionDTO transactionDTO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        requestDTO = CreateWithdrawalRequestDTO.builder()
                .userId("user-001")
                .amount(new BigDecimal("500000"))
                .build();

        User user = new User();
        user.setId("user-001");

        wallet = new Wallet();
        wallet.setUser(user);
        wallet.setBalance(new BigDecimal("1000000"));

        transaction = new WalletTransaction();
        transaction.setId("txn-001");
        transaction.setWallet(wallet);
        transaction.setUser(user);
        transaction.setAmount(requestDTO.getAmount());
        transaction.setStatus(WalletTransaction.Status.PENDING);

        transactionDTO = WalletTransactionDTO.builder()
                .id("txn-001")
                .userId("user-001")
                .amount(requestDTO.getAmount())
                .status("PENDING")
                .build();
    }

    @Test
    @DisplayName("createWithdrawal - hợp lệ - thành công")
    void createWithdrawal_validRequest_success() {
        // GIVEN
        when(walletRepository.findByUserId("user-001")).thenReturn(Optional.of(wallet));
        when(walletTransactionRepository.save(any())).thenReturn(transaction);
        when(walletMapper.toTransactionDTO(any())).thenReturn(transactionDTO);

        // WHEN
        WalletTransactionDTO result = walletService.createWithdrawal(requestDTO);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo("user-001");
        assertThat(result.getAmount()).isEqualByComparingTo("500000");
        assertThat(result.getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("Tạo giao dịch rút tiền - số dư không đủ")
    void createWithdrawal_insufficientBalance_throwsException() {
        // GIVEN
        wallet.setBalance(new BigDecimal("100"));
        Mockito.when(walletRepository.findByUserId("user-001")).thenReturn(Optional.of(wallet));

        // WHEN // THEN
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            walletService.createWithdrawal(requestDTO);
        });

        assertThat(exception.getMessage()).isEqualTo("Số dư không đủ");
    }

    @Test
    @DisplayName("createWithdrawal - không tìm thấy ví - thất bại")
    void createWithdrawal_walletNotFound_throwException() {
        // GIVEN
        when(walletRepository.findByUserId("user-001")).thenReturn(Optional.empty());

        // WHEN
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            walletService.createWithdrawal(requestDTO);
        });

        // THEN
        assertThat(ex.getMessage()).isEqualTo("Không tìm thấy ví");
    }
    @Test
    @DisplayName("Hủy giao dịch rút tiền - thành công")
    void cancelWithdrawal_success() {
        // GIVEN
        WalletTransaction tx = new WalletTransaction();
        tx.setId("txn-001");
        tx.setStatus(WalletTransaction.Status.PENDING);

        Mockito.when(walletTransactionRepository.findById("txn-001")).thenReturn(Optional.of(tx));
        Mockito.when(walletTransactionRepository.save(any(WalletTransaction.class))).thenReturn(tx);

        // WHEN
        walletService.cancelWithdrawal("txn-001");

        // THEN
        assertThat(tx.getStatus()).isEqualTo(WalletTransaction.Status.CANCELLED);
    }

    @Test
    @DisplayName("Hủy giao dịch rút tiền - không phải trạng thái PENDING")
    void cancelWithdrawal_invalidStatus_throwsException() {
        // GIVEN
        WalletTransaction tx = new WalletTransaction();
        tx.setId("txn-002");
        tx.setStatus(WalletTransaction.Status.APPROVED);

        Mockito.when(walletTransactionRepository.findById("txn-002")).thenReturn(Optional.of(tx));

        // WHEN // THEN
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            walletService.cancelWithdrawal("txn-002");
        });

        assertThat(exception.getMessage()).isEqualTo("Chỉ giao dịch ở trạng thái PENDING mới được hủy");
    }

    @Test
    void cancelWithdrawal_transactionNotFound_throwsException() {
        // GIVEN
        Mockito.when(walletTransactionRepository.findById("txn-003")).thenReturn(Optional.empty());

        // WHEN // THEN
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            walletService.cancelWithdrawal("txn-003");
        });

        assertThat(exception.getMessage()).isEqualTo(TRANSACTION_NOT_FOUND.getMessage());
    }
}
