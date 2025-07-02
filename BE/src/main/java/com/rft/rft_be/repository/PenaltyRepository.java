package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Penalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PenaltyRepository extends JpaRepository<Penalty, String> {
    @Query("SELECT p FROM Penalty p WHERE p.user.id = :userId")
    List<Penalty> findByUserId(@Param("userId") String userId);

    @Query("SELECT p FROM Penalty p WHERE p.penaltyType = :penaltyType")
    List<Penalty> findByPenaltyType(@Param("penaltyType") Penalty.PenaltyType penaltyType);

    @Query("SELECT p FROM Penalty p WHERE p.minCancelHour <= :hours")
    List<Penalty> findByMinCancelHourLessThanEqual(@Param("hours") Integer hours);
}