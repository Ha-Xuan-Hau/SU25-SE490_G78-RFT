package com.rft.rft_be.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rft.rft_be.entity.Contract;

public interface ContractRepository extends JpaRepository<Contract, String> {

    @Query("SELECT c FROM Contract c WHERE c.booking.id = :bookingId")
    List<Contract> findByBookingId(@Param("bookingId") String bookingId);

    @Query("SELECT c FROM Contract c WHERE c.user.id = :userId")
    List<Contract> findByUserId(@Param("userId") String userId);

    @Query("SELECT c FROM Contract c WHERE c.status = :status")
    List<Contract> findByStatus(@Param("status") Contract.Status status);


    @Query("SELECT c FROM Contract c WHERE c.booking.id = :bookingId AND c.status = :status")
    List<Contract> findByBookingIdAndStatus(@Param("bookingId") String bookingId, @Param("status") Contract.Status status);


    @Query("SELECT c FROM Contract c WHERE c.user.id = :userId AND c.status = :status")
    List<Contract> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") Contract.Status status);


    //   @Query("SELECT c FROM Contract c " +
    //          "JOIN Booking b ON c.booking.id = b.id " +
//            "JOIN Vehicle v ON b.vehicle.id = v.id " +
    //          "WHERE v.user.id = :vehicleOwnerId AND c.status = :status")
    //   List<Contract> findByUserIdAndStatus(@Param("vehicleOwnerId") String vehicleOwnerId,
    //                                              @Param("status") Contract.Status status);
    // Thêm các method mới cho thống kê
    @Query("SELECT COUNT(c) FROM Contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId AND c.status = :status " +
           "AND MONTH(c.createdAt) = MONTH(CURRENT_DATE) " +
           "AND YEAR(c.createdAt) = YEAR(CURRENT_DATE)")
    long countByProviderIdAndStatusInCurrentMonth(@Param("providerId") String providerId, 
                                                 @Param("status") Contract.Status status);

    @Query("SELECT COUNT(c) FROM Contract c " +
           "JOIN c.booking b " +
           "JOIN b.bookingDetails bd " +
           "JOIN bd.vehicle v " +
           "WHERE v.user.id = :providerId " +
           "AND MONTH(c.createdAt) = MONTH(CURRENT_DATE) " +
           "AND YEAR(c.createdAt) = YEAR(CURRENT_DATE)")
    long countByProviderIdInCurrentMonth(@Param("providerId") String providerId);

//
//    // Find all contracts by vehicle owner ID (all statuses)
//    @Query("SELECT c FROM Contract c " +
//            "JOIN Booking b ON c.booking.id = b.id " +
//            "JOIN Vehicle v ON b.vehicle.id = v.id " +
//            "WHERE v.user.id = :vehicleOwnerId")
//    List<Contract> findByVehicleOwnerId(@Param("vehicleOwnerId") String vehicleOwnerId);
//
//    // Count contracts by vehicle owner ID
//    @Query("SELECT COUNT(c) FROM Contract c " +
//            "JOIN Booking b ON c.booking.id = b.id " +
//            "JOIN Vehicle v ON b.vehicle.id = v.id " +
//            "WHERE v.user.id = :vehicleOwnerId")
//    long countByVehicleOwnerId(@Param("vehicleOwnerId") String vehicleOwnerId);
//
//    // Count contracts by vehicle owner ID and status
//    @Query("SELECT COUNT(c) FROM Contract c " +
//            "JOIN Booking b ON c.booking.id = b.id " +
//            "JOIN Vehicle v ON b.vehicle.id = v.id " +
//            "WHERE v.user.id = :vehicleOwnerId AND c.status = :status")
//    long countByVehicleOwnerIdAndStatus(@Param("vehicleOwnerId") String vehicleOwnerId,
//                                        @Param("status") Contract.Status status);
//
//    // Find contracts by vehicle ID
//    @Query("SELECT c FROM Contract c " +
//            "JOIN Booking b ON c.booking.id = b.id " +
//            "WHERE b.vehicle.id = :vehicleId")
//    List<Contract> findByVehicleId(@Param("vehicleId") String vehicleId);
//
//    // Find contracts by vehicle ID and status
//    @Query("SELECT c FROM Contract c " +
//            "JOIN Booking b ON c.booking.id = b.id " +
//            "WHERE b.vehicle.id = :vehicleId AND c.status = :status")
//    List<Contract> findByVehicleIdAndStatus(@Param("vehicleId") String vehicleId,
//                                           @Param("status") Contract.Status status);


    // @Query("SELECT c FROM Contract c WHERE c.booking.vehicle.user.id = :providerId AND c.status = :status")
    //   List<Contract> findByProviderIdAndStatus(@Param("providerId") String providerId, @Param("status") Contract.Status status);

    @Query("""
                SELECT DISTINCT c
                FROM Contract c
                JOIN BookingDetail bd ON bd.booking.id = c.booking.id
                JOIN Vehicle v ON bd.vehicle.id = v.id
                JOIN User u ON v.user.id = u.id
                WHERE u.id = :providerId AND c.status = :status
                ORDER BY COALESCE(c.updatedAt, c.createdAt) DESC
            """)
    List<Contract> findByProviderIdAndStatus(@Param("providerId") String providerId,
                                             @Param("status") Contract.Status status);
}

