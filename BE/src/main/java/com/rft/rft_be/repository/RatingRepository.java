package com.rft.rft_be.repositories;

import com.rft.rft_be.entities.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RatingRepository extends JpaRepository<Rating, String> {
}