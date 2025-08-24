package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.FinalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface FinalContractRepository extends JpaRepository<FinalContract, String> {

    @Query("SELECT fc FROM FinalContract fc WHERE fc.contract.id = :contractId")
    List<FinalContract> findByContractId(@Param("contractId") String contractId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.user.id = :userId")
    List<FinalContract> findByUserId(@Param("userId") String userId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.user.id = :userId AND fc.contract.id = :contractId")
    List<FinalContract> findByUserIdAndContractId(@Param("userId") String userId, @Param("contractId") String contractId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.timeFinish BETWEEN :startDate AND :endDate")
    List<FinalContract> findByTimeFinishBetween(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.costSettlement >= :minCost")
    List<FinalContract> findByCostSettlementGreaterThanEqual(@Param("minCost") java.math.BigDecimal minCost);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.costSettlement BETWEEN :minCost AND :maxCost")
    List<FinalContract> findByCostSettlementBetween(@Param("minCost") java.math.BigDecimal minCost, @Param("maxCost") java.math.BigDecimal maxCost);

    @Query("SELECT COUNT(fc) FROM FinalContract fc WHERE fc.user.id = :userId")
    long countByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(fc) FROM FinalContract fc WHERE fc.contract.id = :contractId")
    long countByContractId(@Param("contractId") String contractId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.user IS NULL AND fc.contract.status = 'FINISHED'")
    List<FinalContract> findUnapprovedFinalContracts();

    List<FinalContract> findByUserIdOrderByCreatedAtDesc(String userId);

    @Query("""
    SELECT fc.note FROM FinalContract fc 
    WHERE fc.contract.booking.id = :bookingId 
    ORDER BY fc.createdAt DESC
    LIMIT 1
""")
    Optional<String> findCancelNoteByBookingId(@Param("bookingId") String bookingId);

    @Query("""
    SELECT fc.timeFinish FROM FinalContract fc
    WHERE fc.contract.booking.id = :bookingId
    ORDER BY fc.createdAt DESC
    LIMIT 1
""")
    Optional<LocalDateTime> findReturnedAtByBookingId(@Param("bookingId") String bookingId);

    // Thêm các method mới cho thống kê doanh thu
    @Query("SELECT COALESCE(SUM(fc.costSettlement), 0) FROM FinalContract fc " +
           "JOIN fc.contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND MONTH(fc.timeFinish) = MONTH(CURRENT_DATE) " +
           "AND YEAR(fc.timeFinish) = YEAR(CURRENT_DATE)")
    BigDecimal sumRevenueByProviderInCurrentMonth(@Param("providerId") String providerId);

    @Query("SELECT COUNT(fc) FROM FinalContract fc " +
           "JOIN fc.contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND MONTH(fc.timeFinish) = MONTH(CURRENT_DATE) " +
           "AND YEAR(fc.timeFinish) = YEAR(CURRENT_DATE)")
    long countFinalContractsByProviderInCurrentMonth(@Param("providerId") String providerId);

    @Query("SELECT COALESCE(SUM(fc.costSettlement), 0) FROM FinalContract fc " +
           "JOIN fc.contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND MONTH(fc.timeFinish) = :month " +
           "AND YEAR(fc.timeFinish) = :year")
    BigDecimal sumRevenueByProviderAndMonth(@Param("providerId") String providerId, 
                                           @Param("month") int month, 
                                           @Param("year") int year);

    @Query("SELECT COUNT(fc) FROM FinalContract fc " +
           "JOIN fc.contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND MONTH(fc.timeFinish) = :month " +
           "AND YEAR(fc.timeFinish) = :year")
    long countFinalContractsByProviderAndMonth(@Param("providerId") String providerId, 
                                              @Param("month") int month, 
                                              @Param("year") int year);

    // Dashboard aggregation queries
    @Query("SELECT MONTH(fc.timeFinish), YEAR(fc.timeFinish), " +
           "COALESCE(SUM(fc.costSettlement), 0), COUNT(fc) " +
           "FROM FinalContract fc " +
           "JOIN fc.contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND fc.timeFinish >= :startDate " +
           "AND fc.timeFinish < :endDate " +
           "GROUP BY MONTH(fc.timeFinish), YEAR(fc.timeFinish) " +
           "ORDER BY YEAR(fc.timeFinish), MONTH(fc.timeFinish)")
    List<Object[]> getMonthlyRevenueAndCountByProvider(@Param("providerId") String providerId,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);

    // Combined aggregation query for current month revenue and monthly data
    @Query("SELECT " +
           "CASE " +
           "  WHEN MONTH(fc.timeFinish) = MONTH(CURRENT_DATE) AND YEAR(fc.timeFinish) = YEAR(CURRENT_DATE) " +
           "  THEN 'CURRENT' " +
           "  ELSE 'MONTHLY' " +
           "END as data_type, " +
           "MONTH(fc.timeFinish) as month, " +
           "YEAR(fc.timeFinish) as year, " +
           "COALESCE(SUM(fc.costSettlement), 0) as revenue, " +
           "COUNT(fc) as count " +
           "FROM FinalContract fc " +
           "JOIN fc.contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND fc.timeFinish >= :startDate " +
           "AND fc.timeFinish < :endDate " +
           "GROUP BY " +
           "  CASE " +
           "    WHEN MONTH(fc.timeFinish) = MONTH(CURRENT_DATE) AND YEAR(fc.timeFinish) = YEAR(CURRENT_DATE) " +
           "    THEN 'CURRENT' " +
           "    ELSE 'MONTHLY' " +
           "  END, " +
           "MONTH(fc.timeFinish), YEAR(fc.timeFinish) " +
           "ORDER BY YEAR(fc.timeFinish), MONTH(fc.timeFinish)")
    List<Object[]> getCurrentMonthAndMonthlyDataByProvider(@Param("providerId") String providerId,
                                                          @Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate);

    long countByTimeFinishBetween(LocalDateTime start, LocalDateTime end);

    // CHỈ tính các hợp đồng có Contract.status = FINISHED
    @Query("""
           SELECT COALESCE(SUM(fc.costSettlement), 0)
           FROM FinalContract fc
           JOIN fc.contract c
           WHERE fc.timeFinish >= :start AND fc.timeFinish < :end
             AND c.status = :status
           """)
    BigDecimal sumCostSettlementByTimeFinishAndContractStatus(
            LocalDateTime start, LocalDateTime end, Contract.Status status);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.createdAt >= :startDate AND fc.createdAt < :endDate")
    List<FinalContract> findByCreatedAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT fc FROM FinalContract fc 
        JOIN fc.contract c 
        WHERE fc.createdAt >= :startDate 
        AND fc.createdAt < :endDate 
        AND c.status = com.rft.rft_be.entity.Contract.Status.FINISHED
    """)
    List<FinalContract> findCompletedByCreatedAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}