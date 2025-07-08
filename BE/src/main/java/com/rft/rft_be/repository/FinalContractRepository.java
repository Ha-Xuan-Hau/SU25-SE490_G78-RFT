package com.rft.rft_be.repository;

import com.rft.rft_be.entity.FinalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
}