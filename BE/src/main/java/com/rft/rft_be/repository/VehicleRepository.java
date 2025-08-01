package com.rft.rft_be.repository;

import com.rft.rft_be.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import org.springframework.stereotype.Repository;


@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String>, JpaSpecificationExecutor<Vehicle> {
    @Query("SELECT v FROM Vehicle v WHERE v.penalty.id = :penaltyId")
    List<Vehicle> findByPenaltyId(@Param("penaltyId") String penaltyId);

    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.penalty LEFT JOIN FETCH v.user LEFT JOIN FETCH v.brand LEFT JOIN FETCH v.model")
    List<Vehicle> findAllWithPenalty();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.penalty.id = :penaltyId")
    long countByPenaltyId(@Param("penaltyId") String penaltyId);

    @Query("SELECT v FROM Vehicle v WHERE v.user.id = :userId")
    List<Vehicle> findByUserId(@Param("userId") String userId);

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    boolean existsByLicensePlate(String licensePlate);

    @Query("SELECT v FROM Vehicle v WHERE v.status = :status")
    List<Vehicle> findByStatus(@Param("status") Vehicle.Status status);

    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType")
    List<Vehicle> findByVehicleType(@Param("vehicleType") String vehicleType);

    @Query("SELECT v FROM Vehicle v WHERE v.brand.id = :brandId")
    List<Vehicle> findByBrandId(@Param("brandId") String brandId);

    @Query("SELECT v FROM Vehicle v WHERE v.model.id = :modelId")
    List<Vehicle> findByModelId(@Param("modelId") String modelId);

    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType")
    List<Vehicle> findByVehicleType(@Param("vehicleType") Vehicle.VehicleType vehicleType);

    @Query("SELECT v FROM Vehicle v WHERE v.haveDriver = :haveDriver")
    List<Vehicle> findByHaveDriver(@Param("haveDriver") Vehicle.HaveDriver haveDriver);

    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType AND v.status = :status")
    List<Vehicle> findByVehicleTypeAndStatus(@Param("vehicleType") Vehicle.VehicleType vehicleType, @Param("status") Vehicle.Status status);

    @Query("SELECT v FROM Vehicle v LEFT JOIN FETCH v.penalty LEFT JOIN FETCH v.user LEFT JOIN FETCH v.brand LEFT JOIN FETCH v.model " +
            "WHERE v.user.id = :userId AND v.vehicleType = :vehicleType AND v.status = :status")
    List<Vehicle> findByUserIdAndVehicleTypeAndStatusWithPenalty(@Param("userId") String userId,
                                                                 @Param("vehicleType") Vehicle.VehicleType vehicleType,
                                                                 @Param("status") Vehicle.Status status);
    @Query("SELECT v FROM Vehicle v " +
            "LEFT JOIN FETCH v.brand " +
            "LEFT JOIN FETCH v.model " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.user.id = :userId")
    Page<Vehicle> findByUserIdWithBrandAndModel(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT v FROM Vehicle v " +
            "LEFT JOIN FETCH v.brand " +
            "LEFT JOIN FETCH v.model " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.id = :id AND v.user.id = :userId")
    Optional<Vehicle> findByIdAndUserId(@Param("id") String id, @Param("userId") String userId);

    @Query("SELECT v FROM Vehicle v " +
            "LEFT JOIN FETCH v.brand " +
            "LEFT JOIN FETCH v.model " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.id = :id")
    Optional<Vehicle> findByIdWithBrandAndModel(@Param("id") String id);

    @Query("SELECT COUNT(v) > 0 FROM Vehicle v WHERE v.licensePlate = :licensePlate AND v.user.id = :userId AND v.id != :id")
    boolean existsByLicensePlateAndUserIdAndIdNot(@Param("licensePlate") String licensePlate,
                                                  @Param("userId") String userId,
                                                  @Param("id") String id);

    @Query("SELECT COUNT(v) > 0 FROM Vehicle v WHERE v.licensePlate = :licensePlate AND v.user.id = :userId")
    boolean existsByLicensePlateAndUserId(@Param("licensePlate") String licensePlate,
                                          @Param("userId") String userId);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.user.id = :userId")
    long countByUserId(@Param("userId") String userId);

    // User-specific queries
    @Query("SELECT v FROM Vehicle v WHERE v.user.id = :userId AND v.status = :status")
    List<Vehicle> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") Vehicle.Status status);

    @Query("SELECT v FROM Vehicle v WHERE v.user.id = :userId AND v.vehicleType = :vehicleType")
    List<Vehicle> findByUserIdAndVehicleType(@Param("userId") String userId, @Param("vehicleType") Vehicle.VehicleType vehicleType);

    @Query("SELECT v FROM Vehicle v WHERE v.user.id = :userId AND v.vehicleType = :vehicleType AND v.status = :status")
    List<Vehicle> findByUserIdAndVehicleTypeAndStatus(@Param("userId") String userId, @Param("vehicleType") Vehicle.VehicleType vehicleType, @Param("status") Vehicle.Status status);

    @Query("""
                SELECT v FROM Vehicle v
                JOIN Rating r ON v.id = r.vehicle.id
                WHERE (:vehicleTypes IS NULL OR v.vehicleType IN :vehicleTypes)
                  AND (:addresses IS NULL OR v.user.address IN :addresses)
                  AND (:haveDriver IS NULL OR v.haveDriver = :haveDriver)
                  AND (:shipToAddress IS NULL OR v.shipToAddress = :shipToAddress)
                  AND (:brandId IS NULL OR v.brand.id = :brandId)
                  AND (:modelId IS NULL OR v.model.id = :modelId)
                  AND (:numberSeat IS NULL OR v.numberSeat = :numberSeat)
                  AND (:costFrom IS NULL OR v.costPerDay >= :costFrom)
                  AND (:costTo IS NULL OR v.costPerDay <= :costTo)
                GROUP BY v.id
                HAVING AVG(r.star) = 5
            """)
    Page<Vehicle> findVehiclesWithAverageRatingFive(
            @Param("vehicleTypes") List<String> vehicleTypes,
            @Param("addresses") List<String> addresses,
            @Param("haveDriver") Boolean haveDriver,
            @Param("shipToAddress") Vehicle.ShipToAddress shipToAddress,
            @Param("brandId") String brandId,
            @Param("modelId") String modelId,
            @Param("numberSeat") Integer numberSeat,
            @Param("costFrom") BigDecimal costFrom,
            @Param("costTo") BigDecimal costTo,
            Pageable pageable
    );

    @Query("""
            SELECT v FROM Vehicle v
            JOIN FETCH v.user u
            WHERE (:address IS NULL OR LOWER(u.address) LIKE LOWER(CONCAT('%', :address, '%')))
            AND (:type IS NULL OR v.vehicleType = :type)
            AND (COALESCE(:busyVehicleIds, NULL) IS NULL OR v.id NOT IN :busyVehicleIds)
            AND v.status = 'AVAILABLE'
            """)
    Page<Vehicle> findBasicSearch(
            @Param("address") String address,
            @Param("type") Vehicle.VehicleType type,
            @Param("busyVehicleIds") List<String> busyVehicleIds,
            Pageable pageable
    );

    List<Vehicle> findByThumbAndUserIdAndStatus(String thumb, String userId, Vehicle.Status status);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.vehicleType = :vehicleType AND v.status = :status")
    long countByVehicleTypeAndStatus(@Param("vehicleType") Vehicle.VehicleType vehicleType, @Param("status") Vehicle.Status status);

    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType AND v.status = :status")
    Page<Vehicle> findByVehicleTypeAndStatus(@Param("vehicleType") Vehicle.VehicleType vehicleType,
                                             @Param("status") Vehicle.Status status,
                                             Pageable pageable);

    @Query("SELECT v FROM Vehicle v WHERE v.status = :status")
    Page<Vehicle> findByStatus(@Param("status") Vehicle.Status status, Pageable pageable);
}