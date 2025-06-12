package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, String> {
    List<Rating> findAllByVehicle_Id(String vehicleId);
}