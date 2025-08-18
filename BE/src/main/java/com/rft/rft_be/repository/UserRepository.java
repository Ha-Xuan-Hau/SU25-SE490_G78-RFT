package com.rft.rft_be.repository;

import com.rft.rft_be.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    @Modifying
    @Query("UPDATE User u SET u.role = 'PROVIDER' WHERE u.id = :userId")
    void upgradeToProvider(@Param("userId") String userId);

    @Query("SELECT u.id FROM User u WHERE u.status = 'ACTIVE'")
    List<String> findAllActiveUserIds();

    // Admin search methods
    Page<User> findByFullNameContainingIgnoreCase(String name, Pageable pageable);

    Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);

    Page<User> findByStatus(User.Status status, Pageable pageable);

    Page<User> findByRole(User.Role role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "(:name IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:role IS NULL OR u.role = :role)")
    Page<User> findUsersWithFilters(
            @Param("name") String name,
            @Param("email") String email,
            @Param("status") User.Status status,
            @Param("role") User.Role role,
            Pageable pageable
    );
    List<User> findByRole(User.Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :from AND u.createdAt < :to")
    long countByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.createdAt >= :from AND u.createdAt < :to")
    long countByRoleAndCreatedAtBetween(@Param("role") User.Role role,
                                        @Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);
}