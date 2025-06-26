package com.rft.rft_be.repository;

import com.rft.rft_be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    @Modifying
    @Query("UPDATE User u SET u.role = 'PROVIDER' WHERE u.id = :userId")
    void upgradeToProvider(@Param("userId") String userId);
}