package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModelRepository extends JpaRepository<Model, String> {
    @Query("SELECT m FROM Model m WHERE m.brand.id = :brandId")
    List<Model> findByBrandId(@Param("brandId") String brandId);

    @Query("SELECT m FROM Model m LEFT JOIN FETCH m.brand WHERE m.brand.id = :brandId")
    List<Model> findByBrandIdWithBrand(@Param("brandId") String brandId);

    @Query("SELECT COUNT(m) > 0 FROM Model m WHERE m.name = :name AND m.brand.id = :brandId")
    boolean existsByNameAndBrandId(@Param("name") String name, @Param("brandId") String brandId);
}