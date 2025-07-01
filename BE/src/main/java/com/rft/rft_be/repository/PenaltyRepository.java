package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Penalty;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PenaltyRepository extends JpaRepository<Penalty, String> {
}