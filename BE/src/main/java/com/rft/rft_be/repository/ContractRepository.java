package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<Contract, String> {
}