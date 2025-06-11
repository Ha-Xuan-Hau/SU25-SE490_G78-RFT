package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, String> {
}