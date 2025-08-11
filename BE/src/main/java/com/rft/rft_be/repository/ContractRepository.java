package com.rft.rft_be.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import com.rft.rft_be.entity.Booking;
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

    @Query("""
        select count(b)
        from Contract c
        join c.booking b
        where c.user.id = :providerId
          and b.timeBookingStart is not null
          and b.timeBookingStart < :now
          and b.status in :statuses
    """)
    long countProviderOverdueBookings(@Param("providerId") String providerId,
                                      @Param("now") LocalDateTime now,
                                      @Param("statuses") Collection<Booking.Status> statuses);


    //   @Query("SELECT c FROM Contract c " +
    //          "JOIN Booking b ON c.booking.id = b.id " +
//            "JOIN Vehicle v ON b.vehicle.id = v.id " +
    //          "WHERE v.user.id = :vehicleOwnerId AND c.status = :status")
    //   List<Contract> findByUserIdAndStatus(@Param("vehicleOwnerId") String vehicleOwnerId,
    //                                              @Param("status") Contract.Status status);

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

    @Query("""
    select count(distinct c)
    from Contract c
    join BookingDetail bd on bd.booking.id = c.booking.id
    join Vehicle v on bd.vehicle.id = v.id
    join User u on v.user.id = u.id
    where u.id = :providerId and c.status = :status
""")
    long countByProviderIdAndStatus(@Param("providerId") String providerId,
                                    @Param("status") Contract.Status status);
}

