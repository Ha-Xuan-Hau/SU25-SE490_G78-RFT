package com.rft.rft_be.repository;

import com.rft.rft_be.entity.DriverLicense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DriverLicensRepository extends JpaRepository<DriverLicense, String> {

    @Query("SELECT dl FROM DriverLicense dl WHERE dl.user.id = :userId")
    List<DriverLicense> findByUserId(@Param("userId") String userId);

    @Query("SELECT dl From DriverLicense dl where dl.user.id = :userId and dl.status = 'VALID' ")
    List<DriverLicense> findValidByUserId(@Param("userId") String userId);

    Optional<DriverLicense> findByLicenseNumber(String licenseNumber);

    boolean existsByLicenseNumber(String licenseNumber);

    @Query("SELECT dl FROM DriverLicense dl WHERE dl.user.id = :userId AND dl.status = :status")
    List<DriverLicense> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") DriverLicense.Status status);

    @Query("SELECT dl FROM DriverLicense dl WHERE dl.status = :status")
    List<DriverLicense> findByStatus(@Param("status") DriverLicense.Status status);
}