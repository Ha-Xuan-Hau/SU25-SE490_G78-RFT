package com.rft.rft_be.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rft.rft_be.entity.WalletTransaction;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<WalletTransaction> findByStatus(WalletTransaction.Status status);

    List<WalletTransaction> findByStatusAndUserIdNotNull(WalletTransaction.Status status);

    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(String walletId);

    // --- Dashboard stats ---
    @Query("""
           SELECT COUNT(t)
           FROM WalletTransaction t
           WHERE t.status IN :statuses
             AND t.createdAt BETWEEN :from AND :to
           """)
    long countByStatusesAndDateRange(@Param("statuses") List<WalletTransaction.Status> statuses,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);

    @Query("""
           SELECT COUNT(t)
           FROM WalletTransaction t
           WHERE t.status = :status
             AND t.createdAt BETWEEN :from AND :to
           """)
    long countByStatusAndDateRange(@Param("status") WalletTransaction.Status status,
                                   @Param("from") LocalDateTime from,
                                   @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(wt) FROM WalletTransaction wt " +
            "WHERE wt.status = :status " +
            "AND wt.user IS NOT NULL " +
            "AND wt.createdAt BETWEEN :from AND :to")
    long countApprovedWithUserIdInRange(@Param("status") WalletTransaction.Status status,
                                        @Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);

    // Tổng tiền đã duyệt (lấy trị tuyệt đối vì amount đang lưu âm với rút tiền)
    @Query("SELECT COALESCE(SUM(ABS(wt.amount)), 0) FROM WalletTransaction wt " +
            "WHERE wt.status = :status " +
            "AND wt.user IS NOT NULL " +
            "AND wt.createdAt BETWEEN :from AND :to")
    BigDecimal sumApprovedAmountWithUserIdInRange(@Param("status") WalletTransaction.Status status,
                                                  @Param("from") LocalDateTime from,
                                                  @Param("to") LocalDateTime to);
}
