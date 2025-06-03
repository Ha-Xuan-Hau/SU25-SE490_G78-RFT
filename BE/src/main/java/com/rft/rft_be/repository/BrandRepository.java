package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, String> {
}