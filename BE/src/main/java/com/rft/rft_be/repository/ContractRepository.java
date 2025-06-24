package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, String> {
    @Query("SELECT c FROM Contract c WHERE c.booking.id = :bookingId")
    List<Contract> findByBookingId(@Param("bookingId") String bookingId);

    @Query("SELECT c FROM Contract c WHERE c.user.id = :userId")
    List<Contract> findByUserId(@Param("userId") String userId);

    @Query("SELECT c FROM Contract c WHERE c.status = :status")
    List<Contract> findByStatus(@Param("status") Contract.Status status);

    @Query("SELECT c FROM Contract c WHERE c.user.id = :userId AND c.status = :status")
    List<Contract> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") Contract.Status status);

    @Query("SELECT c FROM Contract c WHERE c.booking.id = :bookingId AND c.status = :status")
    List<Contract> findByBookingIdAndStatus(@Param("bookingId") String bookingId, @Param("status") Contract.Status status);
}