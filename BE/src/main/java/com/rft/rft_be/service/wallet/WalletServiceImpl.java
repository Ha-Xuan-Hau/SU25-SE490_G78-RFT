package com.rft.rft_be.service.wallet;

import com.rft.rft_be.dto.admin.WithdrawalDashboardResponse;
import com.rft.rft_be.dto.wallet.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.entity.Wallet;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.mapper.WalletMapper;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import com.rft.rft_be.repository.WalletTransactionRepository;
import com.rft.rft_be.service.Notification.NotificationService;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WalletServiceImpl implements WalletService {

    WalletRepository walletRepository;
    WalletTransactionRepository txRepository;
    UserRepository userRepository;
    WalletMapper walletMapper;
    NotificationService notificationService;
    NotificationMapper notificationMapper;

    /**
     * Lấy thông tin ví theo userId
     */
    @Override
    public WalletDTO getWalletByUserId(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));

        return toDTO(wallet);
    }

    /**
     * Cập nhật thông tin tài khoản ngân hàng trong ví
     * - Kiểm tra trùng số tài khoản & loại tài khoản
     * - Không cho phép trùng với ví khác
     */
    @Override
    public WalletDTO updateWallet(UpdateWalletRequestDTO dto) {
        Wallet wallet = walletRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));

        // ✅ Kiểm tra trùng số tài khoản + loại tài khoản
        boolean exists = walletRepository.existsByBankAccountNumberAndBankAccountType(
                dto.getBankAccountNumber(),
                dto.getBankAccountType()
        );

        // Nếu tồn tại ví khác có cùng số tài khoản và loại tài khoản (ngoại trừ chính ví này)
        if (exists && !dto.getBankAccountNumber().equals(wallet.getBankAccountNumber())) {
            throw new RuntimeException("Tài khoản ngân hàng đã được sử dụng.");
        }

        // Cập nhật thông tin ví
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
    /**
     * Lấy danh sách giao dịch rút tiền của 1 user
     */
    @Override
    public List<WalletTransactionDTO> getWithdrawalsByUser(String userId) {
        // Lấy walletId của user
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));
        String walletId = wallet.getId();

        // Lấy tất cả giao dịch liên quan đến walletId này
        List<WalletTransaction> transactions = txRepository.findByWalletIdOrderByCreatedAtDesc(walletId);

        return walletMapper.toTransactionDTOs(transactions);
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

    /**
     * Tạo yêu cầu rút tiền:
     * - Trừ tiền ngay lập tức
     * - Giao dịch ở trạng thái PENDING
     */
    @Override
    public WalletTransactionDTO createWithdrawal(CreateWithdrawalRequestDTO dto) {
        Wallet wallet = walletRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));
        if (wallet.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new RuntimeException("Số dư không đủ");
        }
        WalletTransaction tx = new WalletTransaction();
        tx.setAmount(dto.getAmount().negate());
        tx.setStatus(WalletTransaction.Status.PENDING);
        tx.setWallet(wallet);
        wallet.setBalance(wallet.getBalance().subtract(dto.getAmount()));
        walletRepository.save(wallet);
//        tx.setUser(wallet.getUser());
        tx.setCreatedAt(LocalDateTime.now());
        return walletMapper.toTransactionDTO(txRepository.save(tx));
    }

    @Override
    public WalletTransactionDTO createTopUp(CreateWithdrawalRequestDTO dto) {
        Wallet wallet = walletRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví"));
        WalletTransaction tx = new WalletTransaction();
        tx.setAmount(dto.getAmount());
        tx.setStatus(WalletTransaction.Status.PENDING);
        tx.setWallet(wallet);
//        tx.setUser(wallet.getUser());
        tx.setCreatedAt(LocalDateTime.now());
        return walletMapper.toTransactionDTO(txRepository.save(tx));
    }
    /**
     * Hủy giao dịch (ADMIN)
     */
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
    /**
     * Hủy giao dịch (USER)
     * - Kiểm tra quyền sở hữu giao dịch
     */
    @Override
    public void cancelWithdrawalAsUser(String transactionId, String userId) {
        WalletTransaction tx = txRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        // ✅ Kiểm tra quyền sở hữu
        if (!tx.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy giao dịch này");
        }

        if (tx.getStatus() != WalletTransaction.Status.PENDING) {
            throw new RuntimeException("Chỉ giao dịch ở trạng thái PENDING mới được hủy");
        }

        tx.setStatus(WalletTransaction.Status.CANCELLED);
        txRepository.save(tx);
    }
    /**
     * Lấy danh sách giao dịch đã duyệt (APPROVED)
     * - Kèm thông tin user & staff
     */
    @Override
    public java.util.List<WalletTransactionDTO> getApprovedWithdrawals() {
        //get approved transaction and userid not null
        List<WalletTransaction> approvedTransactions = txRepository.findByStatusAndUserIdNotNull(WalletTransaction.Status.APPROVED);

//        if (approvedTransactions.isEmpty()) {
//            throw new RuntimeException("Không có giao dịch nào đã được phê duyệt.");
//        }

        //map to dto
        List<WalletTransactionDTO> transactionDTOs = approvedTransactions.stream()
                .map(walletMapper::toTransactionDTO)
                .collect(Collectors.toList());

        //update User info
        for (WalletTransactionDTO dto : transactionDTOs) {
            Wallet wallet = walletRepository.findById(dto.getWalletId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ví cho walletId: " + dto.getWalletId()));

            User user = wallet.getUser();
            if (user != null) {
                dto.setFullName(user.getFullName());
                dto.setEmail(user.getEmail());
            } else {
                dto.setFullName("N/A");
                dto.setEmail("N/A");
            }

        }

        //update Staff info
        for (WalletTransactionDTO dto : transactionDTOs) {
            // Lấy thông tin nhân viên dựa trên userId (staff Id)
            User staff = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên cho userId: " + dto.getUserId()));

            dto.setStaffFullName(staff.getFullName());
            dto.setStaffEmail(staff.getEmail());
        }

        return transactionDTOs;
    }
    /**
     * Lấy danh sách giao dịch theo trạng thái
     */
    @Override
    public List<WalletTransactionDTO> getAllWithdrawals(WalletTransaction.Status status) {
        List<WalletTransaction> list = txRepository.findByStatus(status);

        //get user info
        List<WalletTransactionDTO> transactionDTOs = list.stream()
                .map(walletMapper::toTransactionDTO)
                .collect(Collectors.toList());

        //update user info
        for (WalletTransactionDTO dto : transactionDTOs) {
            Wallet wallet = walletRepository.findById(dto.getWalletId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ví cho walletId: " + dto.getWalletId()));

            User user = wallet.getUser();
            if (user != null) {
                dto.setFullName(user.getFullName());
                dto.setEmail(user.getEmail());
            } else {
                dto.setFullName("N/A");
                dto.setEmail("N/A");
            }

        }
        return transactionDTOs;
    }
    /**
     * Lấy thông tin 1 giao dịch rút tiền theo ID
     */
    @Override
    public WalletTransactionDTO getWithdrawalById(String id) {
        //get transaction by id
        WalletTransaction transaction = txRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        //map to dto
        WalletTransactionDTO dto = walletMapper.toTransactionDTO(transaction);

        //get user info from wallet
        Wallet wallet = walletRepository.findById(dto.getWalletId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví người dùng cho walletId: " + dto.getWalletId()));

        User user = wallet.getUser();
        if (user != null) { // Kiểm tra xem người dùng có tồn tại không
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
        } else {
            dto.setFullName("N/A");
            dto.setEmail("N/A");
        }

        return dto;
    }
    /**
     * Cập nhật trạng thái rút tiền (duyệt / từ chối)
     * - Nếu từ chối → Hoàn tiền
     * - Gửi thông báo cho user
     */
    @Override
    public void updateWithdrawalStatus(String id, String status, String staffId) {
        WalletTransaction tx = txRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        WalletTransactionDTO dto = walletMapper.toTransactionDTO(tx);

        Wallet wallet = walletRepository.findById(dto.getWalletId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ví cho walletId: " + dto.getWalletId()));

        try {
            WalletTransaction.Status newStatus = WalletTransaction.Status.valueOf(status.toUpperCase());

            // ✅ Nếu từ chối → hoàn tiền lại
            if (newStatus == WalletTransaction.Status.REJECTED) {
                wallet.setBalance(wallet.getBalance().add(tx.getAmount()));
                walletRepository.save(wallet);
            }

            tx.setStatus(newStatus);

            // ✅ Gán nhân viên xử lý
            User staff = userRepository.findById(staffId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên cho userId: " + staffId));
            tx.setUser(staff);
            tx.setUpdatedAt(LocalDateTime.now());

            // ✅ Gửi thông báo cho user
            User user = wallet.getUser();
            String formattedAmount = NumberFormat.getCurrencyInstance(new Locale("vi", "VN")).format(dto.getAmount());
            String message = (newStatus == WalletTransaction.Status.APPROVED)
                    ? String.format("Yêu cầu rút \"%s\" của bạn đã được duyệt", formattedAmount)
                    : String.format("Yêu cầu rút \"%s\" của bạn đã bị từ chối và tiền đã được hoàn lại", formattedAmount);

            notificationService.createNotification(notificationMapper.toNotificationCreateDTO(
                    user.getId(), NotificationMapper.WITHDRAWAL_APPROVED, message, null)
            );

        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không khả dụng: " + status);
        }

        txRepository.save(tx);
    }
    //Screen withdraw on dashboard
    @Override
    public WithdrawalDashboardResponse getWithdrawalDashboard(LocalDateTime from, LocalDateTime to) {
        var waitingStatuses = List.of(
                WalletTransaction.Status.PENDING,
                WalletTransaction.Status.PROCESSING
        );

        long waiting = txRepository.countByStatusesAndDateRange(waitingStatuses, from, to);
        long approved = txRepository.countByStatusAndDateRange(WalletTransaction.Status.APPROVED, from, to);
        BigDecimal totalApproved = txRepository.sumApprovedAmountInRange(from, to);

        return WithdrawalDashboardResponse.builder()
                .waitingCount(waiting)
                .approvedCount(approved)
                .totalApprovedAmount(totalApproved)
                .build();
    }
}
