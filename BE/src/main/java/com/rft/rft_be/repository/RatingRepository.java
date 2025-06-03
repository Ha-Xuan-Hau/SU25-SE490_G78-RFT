package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RatingRepository extends JpaRepository<Rating, String> {
}