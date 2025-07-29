package com.rft.rft_be.service.wallet;

import com.rft.rft_be.dto.wallet.*;
import com.rft.rft_be.entity.Wallet;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.mapper.WalletMapper;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.repository.WalletTransactionRepository;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WalletServiceImpl implements  WalletService {

    WalletRepository walletRepository;
    WalletTransactionRepository txRepository;
    UserRepository userRepository;
    WalletMapper walletMapper;

    @Override
    public WalletDTO getWalletByUserId(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));

        return toDTO(wallet);
    }

    @Override
    public WalletDTO updateWallet(UpdateWalletRequestDTO dto) {
        Wallet wallet = walletRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));

        wallet.setBankAccountNumber(dto.getBankAccountNumber());
        wallet.setBankAccountName(dto.getBankAccountName());
        wallet.setBankAccountType(dto.getBankAccountType());

        walletRepository.save(wallet);
        return toDTO(wallet);
    }

    @Override
    @Transactional
    public void updateWalletBalance(String walletTransactionId, BigDecimal amount) {
        WalletTransaction walletTransaction = txRepository.findById(walletTransactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã giao dịch"));

        if (!walletTransaction.getStatus().equals(WalletTransaction.Status.PENDING)) {
            throw new RuntimeException("giao dịch này đã được xử lý");
        }

        Wallet wallet = walletTransaction.getWallet();

        // Cộng tiền vào ví
        wallet.setBalance(wallet.getBalance().add(amount));

        // Cập nhật trạng thái giao dịch
        walletTransaction.setStatus(WalletTransaction.Status.APPROVED);

        // Lưu lại ví và giao dịch
        walletRepository.save(wallet);
        txRepository.save(walletTransaction);
    }

    @Override
    public List<WalletTransactionDTO> getWithdrawalsByUser(String userId) {
        return walletMapper.toTransactionDTOs(txRepository.findByWallet_User_IdOrderByCreatedAtDesc(userId));
    }
    private WalletDTO toDTO(Wallet wallet) {
        return new WalletDTO(
                wallet.getId(),
                wallet.getUser().getId(),
                wallet.getBalance(),
                wallet.getBankAccountNumber(),
                wallet.getBankAccountName(),
                wallet.getBankAccountType()
        );
    }
    @Override
    @Transactional
    public WalletTransactionDTO createWithdrawal(CreateWithdrawalRequestDTO request) {
        Wallet wallet = walletRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví với id: " + request.getUserId()));

        // Kiểm tra số dư
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Số dư không đủ để rút tiền");
        }

        // Tạo giao dịch rút tiền
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .amount(request.getAmount())
                .status(WalletTransaction.Status.PENDING)
                .user(wallet.getUser())
                .build();

        txRepository.save(tx);
        return walletMapper.toTransactionDTO(tx);
    }

    @Override
    public WalletTransactionDTO createTopUp(CreateWithdrawalRequestDTO dto) {
        Wallet wallet = walletRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));
        WalletTransaction tx = new WalletTransaction();
        tx.setAmount(dto.getAmount());
        tx.setStatus(WalletTransaction.Status.PENDING);
        tx.setWallet(wallet);
        tx.setUser(wallet.getUser());
        tx.setCreatedAt(LocalDateTime.now());
        return walletMapper.toTransactionDTO(txRepository.save(tx));
    }

    @Override
    public void cancelWithdrawal(String transactionId) {
        WalletTransaction tx = txRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
        if (tx.getStatus() != WalletTransaction.Status.PENDING) {
            throw new RuntimeException("Chỉ giao dịch ở trạng thái PENDING mới được hủy");
        }
        tx.setStatus(WalletTransaction.Status.CANCELLED);
        txRepository.save(tx);
    }
    @Override
    public void cancelWithdrawalAsUser(String transactionId, String userId) {
        WalletTransaction tx = txRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        // ✅ Kiểm tra người tạo đơn chính là chủ sở hữu ví
        if (!tx.getWallet().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy giao dịch này");
        }

        if (tx.getStatus() != WalletTransaction.Status.PENDING) {
            throw new RuntimeException("Chỉ giao dịch ở trạng thái PENDING mới được hủy");
        }

        tx.setStatus(WalletTransaction.Status.CANCELLED);
        txRepository.save(tx);
    }

    @Override
    public List<WalletTransactionDTO> getAllWithdrawals(WalletTransaction.Status status) {
        List<WalletTransaction> list = txRepository.findByStatus(status);
        return list.stream().map(walletMapper::toTransactionDTO).toList();
    }

    @Override
    public WalletTransactionDTO getWithdrawalById(String id) {
        return walletMapper.toTransactionDTO(txRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch")));
    }

    @Override
    public void updateWithdrawalStatus(String id, String status) {
        WalletTransaction tx = txRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        try {
            tx.setStatus(WalletTransaction.Status.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái khôn khả dụng: " + status);
        }
        txRepository.save(tx);
    }

}
