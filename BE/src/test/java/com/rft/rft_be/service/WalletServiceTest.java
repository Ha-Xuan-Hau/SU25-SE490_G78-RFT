package com.rft.rft_be.service;

import com.rft.rft_be.dto.Notification.NotificationCreateDTO;
import com.rft.rft_be.dto.wallet.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Wallet;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.mapper.WalletMapper;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.repository.WalletTransactionRepository;
import com.rft.rft_be.service.Notification.NotificationService;
import com.rft.rft_be.service.wallet.WalletServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class WalletServiceTest {

    @Mock WalletRepository walletRepository;
    @Mock WalletTransactionRepository txRepository;
    @Mock UserRepository userRepository;
    @Mock WalletMapper walletMapper;
    @Mock NotificationMapper notificationMapper;
    @Mock NotificationService notificationService;

    @InjectMocks WalletServiceImpl walletService;


    Wallet wallet;
    User user;
    WalletTransaction tx;
    WalletTransactionDTO transactionDTO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        user = new User();
        user.setId("user1");

        wallet = new Wallet();
        wallet.setId("wallet1");
        wallet.setUser(user);
        wallet.setBalance(new BigDecimal("1000.00"));

        tx = new WalletTransaction();
        tx.setId("tx1");
        tx.setWallet(wallet);
        tx.setUser(user);
        tx.setAmount(new BigDecimal("500.00"));
        tx.setStatus(WalletTransaction.Status.PENDING);
        tx.setCreatedAt(LocalDateTime.now());

        transactionDTO = new WalletTransactionDTO();
        transactionDTO.setId("tx-1");
        transactionDTO.setAmount(new BigDecimal("10000"));
        transactionDTO.setStatus("PENDING");
        transactionDTO.setUserId("user-1");
        transactionDTO.setCreatedAt(LocalDateTime.now());
    }

    @Test void getWalletByUserId_success() {
        when(walletRepository.findByUserId("user1")).thenReturn(Optional.of(wallet));
        when(walletMapper.toDTO(any())).thenReturn(new WalletDTO());
        assertNotNull(walletService.getWalletByUserId("user1"));
    }

    @Test void getWalletByUserId_notFound() {
        when(walletRepository.findByUserId("user1")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> walletService.getWalletByUserId("user1"));
    }

    @Test void updateWallet_success() {
        UpdateWalletRequestDTO dto = new UpdateWalletRequestDTO("user1", "123", "Name", "Type");
        when(walletRepository.findByUserId("user1")).thenReturn(Optional.of(wallet));
        when(walletMapper.toDTO(any())).thenReturn(new WalletDTO());
        assertNotNull(walletService.updateWallet(dto));
    }

    @Test void updateWallet_notFound() {
        UpdateWalletRequestDTO dto = new UpdateWalletRequestDTO("user1", "123", "Name", "Type");
        when(walletRepository.findByUserId("user1")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> walletService.updateWallet(dto));
    }

    @Test void updateWalletBalance_success() {
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        walletService.updateWalletBalance("tx1", new BigDecimal("500.00"));
        assertEquals(WalletTransaction.Status.APPROVED, tx.getStatus());
    }

    @Test void updateWalletBalance_transactionNotFound() {
        when(txRepository.findById("tx1")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> walletService.updateWalletBalance("tx1", new BigDecimal("100")));
    }

    @Test void createWithdrawal_success() {
        CreateWithdrawalRequestDTO dto = new CreateWithdrawalRequestDTO("user1", new BigDecimal("100"));
        when(walletRepository.findByUserId("user1")).thenReturn(Optional.of(wallet));
        when(txRepository.save(any())).thenReturn(tx);
        when(walletMapper.toTransactionDTO(any())).thenReturn(new WalletTransactionDTO());
        assertNotNull(walletService.createWithdrawal(dto));
    }

    @Test void createWithdrawal_insufficientBalance() {
        wallet.setBalance(new BigDecimal("50"));
        CreateWithdrawalRequestDTO dto = new CreateWithdrawalRequestDTO("user1", new BigDecimal("100"));
        when(walletRepository.findByUserId("user1")).thenReturn(Optional.of(wallet));
        assertThrows(RuntimeException.class, () -> walletService.createWithdrawal(dto));
    }

    @Test void cancelWithdrawalAsUser_success() {
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        walletService.cancelWithdrawalAsUser("tx1", "user1");
        assertEquals(WalletTransaction.Status.CANCELLED, tx.getStatus());
    }

    @Test void cancelWithdrawalAsUser_wrongUser() {
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        assertThrows(Exception.class, () -> walletService.cancelWithdrawalAsUser("tx1", "wrong-user"));
    }

    @Test void cancelWithdrawal_success() {
        tx.setStatus(WalletTransaction.Status.PENDING);
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        walletService.cancelWithdrawal("tx1");
        assertEquals(WalletTransaction.Status.CANCELLED, tx.getStatus());
    }

    @Test void cancelWithdrawal_invalidStatus() {
        tx.setStatus(WalletTransaction.Status.APPROVED);
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        assertThrows(RuntimeException.class, () -> walletService.cancelWithdrawal("tx1"));
    }

    @Test void getWithdrawalsByUser_success() {
        List<WalletTransaction> list = List.of(tx);
        when(txRepository.findByUserIdOrderByCreatedAtDesc("user1")).thenReturn(list);
        when(walletMapper.toTransactionDTOs(list)).thenReturn(List.of(transactionDTO));
        assertEquals(1, walletService.getWithdrawalsByUser("user1").size());
    }

    @Test void getApprovedWithdrawals_success() {
        tx.setStatus(WalletTransaction.Status.APPROVED);
        when(txRepository.findByStatusAndUserIdNotNull(WalletTransaction.Status.APPROVED)).thenReturn(List.of(tx));
        when(walletMapper.toTransactionDTO(tx)).thenReturn(transactionDTO);
        when(walletRepository.findById(any())).thenReturn(Optional.of(wallet));
        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        assertEquals(1, walletService.getApprovedWithdrawals().size());
    }

    @Test void getAllWithdrawals_success() {
        when(txRepository.findByStatus(WalletTransaction.Status.PENDING)).thenReturn(List.of(tx));
        when(walletMapper.toTransactionDTO(tx)).thenReturn(transactionDTO);
        when(walletRepository.findById(any())).thenReturn(Optional.of(wallet));
        assertEquals(1, walletService.getAllWithdrawals(WalletTransaction.Status.PENDING).size());
    }

    @Test void updateWithdrawalStatus_invalidStatus() {
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        assertThrows(RuntimeException.class, () -> walletService.updateWithdrawalStatus("tx1", "INVALID", "staffId"));
    }

    @Test void updateWithdrawalStatus_success() {
        transactionDTO.setWalletId("wallet1");
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        when(walletMapper.toTransactionDTO(tx)).thenReturn(transactionDTO);
        when(userRepository.findById("user1")).thenReturn(Optional.of(user));
        when(walletRepository.findById("wallet1")).thenReturn(Optional.of(wallet));
        when(notificationMapper.toNotificationCreateDTO(any(), any(), any(), any()))
                .thenReturn(new NotificationCreateDTO()); // tạo object hợp lý
        assertDoesNotThrow(() -> walletService.updateWithdrawalStatus("tx1", "APPROVED", "user1"));
    }

    @Test void getWithdrawalById_success() {
        wallet.setId("wallet1");
        tx.setWallet(wallet);
        transactionDTO.setWalletId("wallet1");
        when(txRepository.findById("tx1")).thenReturn(Optional.of(tx));
        when(walletMapper.toTransactionDTO(tx)).thenReturn(transactionDTO);
        when(walletRepository.findById("wallet1")).thenReturn(Optional.of(wallet));
        assertNotNull(walletService.getWithdrawalById("tx1"));
    }

    @Test void createTopUp_success() {
        CreateWithdrawalRequestDTO dto = new CreateWithdrawalRequestDTO("user-1", new BigDecimal("10000"));
        when(walletRepository.findByUserId("user-1")).thenReturn(Optional.of(wallet));
        when(txRepository.save(any())).thenReturn(tx);
        when(walletMapper.toTransactionDTO(any())).thenReturn(transactionDTO);
        WalletTransactionDTO result = walletService.createTopUp(dto);
        assertThat(result.getId()).isEqualTo("tx-1");
        assertThat(result.getAmount()).isEqualByComparingTo("10000");
        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(txRepository, times(1)).save(any());
    }

    @Test void createTopUp_walletNotFound_shouldThrowException() {
        CreateWithdrawalRequestDTO dto = new CreateWithdrawalRequestDTO("user-999", new BigDecimal("10000"));
        when(walletRepository.findByUserId("user-999")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> walletService.createTopUp(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Không tìm thấy ví");
    }
}
