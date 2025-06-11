package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<Contract, String> {
}