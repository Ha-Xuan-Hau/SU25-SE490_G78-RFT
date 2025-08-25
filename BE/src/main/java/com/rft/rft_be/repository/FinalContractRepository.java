package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.FinalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FinalContractRepository extends JpaRepository<FinalContract, String> {

    // --------- Truy vấn cơ bản ----------
    @Query("SELECT fc FROM FinalContract fc WHERE fc.contract.id = :contractId")
    List<FinalContract> findByContractId(@Param("contractId") String contractId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.user.id = :userId")
    List<FinalContract> findByUserId(@Param("userId") String userId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.user.id = :userId AND fc.contract.id = :contractId")
    List<FinalContract> findByUserIdAndContractId(@Param("userId") String userId, @Param("contractId") String contractId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.timeFinish BETWEEN :startDate AND :endDate")
    List<FinalContract> findByTimeFinishBetween(@Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.costSettlement >= :minCost")
    List<FinalContract> findByCostSettlementGreaterThanEqual(@Param("minCost") BigDecimal minCost);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.costSettlement BETWEEN :minCost AND :maxCost")
    List<FinalContract> findByCostSettlementBetween(@Param("minCost") BigDecimal minCost,
                                                    @Param("maxCost") BigDecimal maxCost);

    @Query("SELECT COUNT(fc) FROM FinalContract fc WHERE fc.user.id = :userId")
    long countByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(fc) FROM FinalContract fc WHERE fc.contract.id = :contractId")
    long countByContractId(@Param("contractId") String contractId);

    @Query("SELECT fc FROM FinalContract fc WHERE fc.user IS NULL AND fc.contract.status = 'FINISHED'")
    List<FinalContract> findUnapprovedFinalContracts();

    List<FinalContract> findByUserIdOrderByCreatedAtDesc(String userId);

    // Hai query trước dùng LIMIT trong JPQL -> đổi sang native để lấy bản ghi mới nhất
    @Query(value = """
            SELECT fc.note
            FROM final_contracts fc
            JOIN contracts c ON fc.contract_id = c.id
            JOIN bookings b ON c.booking_id = b.id
            WHERE b.id = :bookingId
            ORDER BY fc.created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<String> findCancelNoteByBookingId(@Param("bookingId") String bookingId);

    @Query(value = """
            SELECT fc.time_finish
            FROM final_contracts fc
            JOIN contracts c ON fc.contract_id = c.id
            JOIN bookings b ON c.booking_id = b.id
            WHERE b.id = :bookingId
            ORDER BY fc.created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<LocalDateTime> findReturnedAtByBookingId(@Param("bookingId") String bookingId);

    // --------- Thống kê/Doanh thu cho Provider (đã sửa: dùng EXISTS + DISTINCT + timeFinish) ----------

    // Doanh thu tháng này (tính trên FinalContract đã tất toán trong tháng hiện tại)
    @Query("""
           select coalesce(sum(fc.costSettlement), 0)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = month(current_date)
           and year(fc.timeFinish)  = year(current_date)
           """)
    BigDecimal sumRevenueByProviderInCurrentMonth(@Param("providerId") String providerId);

    // Số đơn tháng này (đếm DISTINCT FinalContract)
    @Query("""
           select count(distinct fc.id)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = month(current_date)
           and year(fc.timeFinish)  = year(current_date)
           """)
    long countFinalContractsByProviderInCurrentMonth(@Param("providerId") String providerId);

    // Doanh thu theo tháng/năm
    @Query("""
           select coalesce(sum(fc.costSettlement), 0)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = :month
           and year(fc.timeFinish)  = :year
           """)
    BigDecimal sumRevenueByProviderAndMonth(@Param("providerId") String providerId,
                                            @Param("month") int month,
                                            @Param("year") int year);

    // Số đơn theo tháng/năm (DISTINCT)
    @Query("""
           select count(distinct fc.id)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = :month
           and year(fc.timeFinish)  = :year
           """)
    long countFinalContractsByProviderAndMonth(@Param("providerId") String providerId,
                                               @Param("month") int month,
                                               @Param("year") int year);

    // Doanh thu & số đơn group theo tháng (khoảng thời gian)
    @Query("""
           select year(fc.timeFinish) as y,
                  month(fc.timeFinish) as m,
                  coalesce(sum(fc.costSettlement), 0) as revenue,
                  count(distinct fc.id) as cnt
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and fc.timeFinish >= :startDate
           and fc.timeFinish <  :endDate
           group by year(fc.timeFinish), month(fc.timeFinish)
           order by y, m
           """)
    List<Object[]> getMonthlyRevenueAndCountByProvider(@Param("providerId") String providerId,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);

    // Gộp dữ liệu: CURRENT vs MONTHLY (dùng timeFinish cho nhất quán)
    @Query("""
           select case
                    when month(fc.timeFinish) = month(current_date)
                     and year(fc.timeFinish)  = year(current_date) then 'CURRENT'
                    else 'MONTHLY'
                  end as data_type,
                  month(fc.timeFinish) as month,
                  year(fc.timeFinish)  as year,
                  coalesce(sum(case when c.status = 'FINISHED' then fc.costSettlement else 0 end), 0) as revenue,
                  count(distinct case when c.status = 'FINISHED' then fc.id end) as count
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and fc.timeFinish >= :startDate
           and fc.timeFinish <  :endDate
           group by case
                      when month(fc.timeFinish) = month(current_date)
                       and year(fc.timeFinish)  = year(current_date) then 'CURRENT'
                      else 'MONTHLY'
                    end,
                    month(fc.timeFinish), year(fc.timeFinish)
           order by year(fc.timeFinish), month(fc.timeFinish)
           """)
    List<Object[]> getCurrentMonthAndMonthlyDataByProvider(@Param("providerId") String providerId,
                                                           @Param("startDate") LocalDateTime startDate,
                                                           @Param("endDate") LocalDateTime endDate);

    // Đếm bản ghi theo khoảng timeFinish (giữ nguyên)
    long countByTimeFinishBetween(LocalDateTime start, LocalDateTime end);

    // Tổng tiền theo trạng thái Contract & timeFinish (giữ nguyên)
    @Query("""
           select coalesce(sum(fc.costSettlement), 0)
           from FinalContract fc
           join fc.contract c
           where fc.timeFinish >= :start and fc.timeFinish < :end
             and c.status = :status
           """)
    BigDecimal sumCostSettlementByTimeFinishAndContractStatus(@Param("start") LocalDateTime start,
                                                              @Param("end") LocalDateTime end,
                                                              @Param("status") Contract.Status status);

    // Thống kê theo tháng cho provider (không nhân bản)
    @Query("""
           select 
             count(distinct c.booking.user.id) as totalCustomersWithFinalContract,
             coalesce(sum(fc.costSettlement), 0) as totalRevenueFromFinalContracts,
             count(distinct case when c.status = 'FINISHED' then c.booking.user.id end) as customersWithCompletedContracts,
             coalesce(sum(case when c.status = 'FINISHED' then fc.costSettlement else 0 end), 0) as revenueFromCompletedContracts,
             count(distinct fc.id) as totalFinalContracts,
             count(distinct case when c.status = 'FINISHED'  then fc.id end) as completedFinalContracts,
             count(distinct case when c.status = 'CANCELLED' then fc.id end) as cancelledFinalContracts
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = :month
           and year(fc.timeFinish)  = :year
           """)
    Object[] getMonthlyStatisticsByProvider(@Param("providerId") String providerId,
                                            @Param("month") int month,
                                            @Param("year") int year);

    // Kiểm tra có FinalContract nào trong tháng (không nhân bản)
    @Query("""
           select count(distinct fc.id)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = :month
           and year(fc.timeFinish)  = :year
           """)
    long countFinalContractsByProviderInMonth(@Param("providerId") String providerId,
                                              @Param("month") int month,
                                              @Param("year") int year);

    // Đếm theo Contract status trong tháng hiện tại (DISTINCT)
    @Query("""
           select c.status, count(distinct fc.id)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = month(current_date)
           and year(fc.timeFinish)  = year(current_date)
           group by c.status
           """)
    List<Object[]> countFinalContractsByProviderAndStatusInCurrentMonth(@Param("providerId") String providerId);

    // Debug theo tháng (không nhân bản)
    @Query("""
           select fc.id, fc.costSettlement, c.status, c.booking.user.id, fc.timeFinish
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           and month(fc.timeFinish) = :month
           and year(fc.timeFinish)  = :year
           """)
    List<Object[]> getFinalContractDetailsByProviderAndMonth(@Param("providerId") String providerId,
                                                             @Param("month") int month,
                                                             @Param("year") int year);

    // Debug tất cả FinalContract của provider (không nhân bản)
    @Query("""
           select fc.id, fc.costSettlement, c.status, c.booking.user.id, fc.timeFinish,
                  month(fc.timeFinish), year(fc.timeFinish)
           from FinalContract fc
           join fc.contract c
           where exists (
             select 1
             from com.rft.rft_be.entity.Booking b
             join b.bookingDetails bd
             join bd.vehicle v
             where b = c.booking and v.user.id = :providerId
           )
           order by fc.timeFinish desc
           """)
    List<Object[]> getAllFinalContractsByProvider(@Param("providerId") String providerId);

    // Khoảng createdAt (giữ để dùng cho báo cáo khác nếu cần)
    @Query("SELECT fc FROM FinalContract fc WHERE fc.createdAt >= :startDate AND fc.createdAt < :endDate")
    List<FinalContract> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("""
           SELECT fc FROM FinalContract fc 
           JOIN fc.contract c 
           WHERE fc.createdAt >= :startDate 
             AND fc.createdAt < :endDate 
             AND c.status = com.rft.rft_be.entity.Contract.Status.FINISHED
           """)
    List<FinalContract> findCompletedByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                                                        @Param("endDate") LocalDateTime endDate);
}
