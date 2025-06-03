package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModelRepository extends JpaRepository<Model, String> {
}