package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserRegisterVehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRegisterVehicleRepository extends JpaRepository<UserRegisterVehicle, String> {
    boolean existsByUserIdAndVehicleType(String userId, String vehicleType);
    List<UserRegisterVehicle> findByUserId(String userId);
}