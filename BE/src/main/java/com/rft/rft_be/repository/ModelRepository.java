package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.Model;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModelRepository extends JpaRepository<Model, String> {
}