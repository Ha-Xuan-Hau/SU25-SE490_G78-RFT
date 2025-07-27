package com.rft.rft_be.entity;

import jakarta.persistence.*;
import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id")
    private Model model;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penalty_id")
    private Penalty penalty;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;

    @Lob
    @Column(name = "vehicle_features")
    private String vehicleFeatures;

    @Lob
    @Column(name = "vehicle_images")
    private String vehicleImages;

    @Enumerated(EnumType.STRING)
    @Column(name = "have_driver")
    private  HaveDriver haveDriver = HaveDriver.NO;

    @Enumerated(EnumType.STRING)
    @Column(name = "insurance_status")
    private InsuranceStatus insuranceStatus = InsuranceStatus.NO;

    @Enumerated(EnumType.STRING)
    @Column(name = "ship_to_address")
    private ShipToAddress shipToAddress = ShipToAddress.NO;

    @Column(name = "number_seat")
    private Integer numberSeat;

    @Column(name = "year_manufacture")
    private Integer yearManufacture;

    @Enumerated(EnumType.STRING)
    @Column(name = "transmission")
    private Transmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type")
    private FuelType fuelType;

    @Lob
    @Column(name = "description")
    private String description;

    @ColumnDefault("1")
    @Column(name = "number_vehicle")
    private Integer numberVehicle;

    @Column(name = "cost_per_day", precision = 10, scale = 2)
    private BigDecimal costPerDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.AVAILABLE;

    @Lob
    @Column(name = "thumb")
    private String thumb;

    @ColumnDefault("0")
    @Column(name = "total_ratings")
    private Integer totalRatings;

    @OneToOne(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ExtraFeeRule extraFeeRule;

    @ColumnDefault("0")
    @Column(name = "likes")
    private Integer likes;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum HaveDriver {
        YES, NO
    }
    public enum InsuranceStatus {
        YES, NO
    }
    public enum VehicleType{
        CAR, MOTORBIKE, BICYCLE
    }
    public enum ShipToAddress {
        YES, NO
    }
    public enum Transmission {
        MANUAL, AUTOMATIC
    }
    public enum FuelType {
        GASOLINE, ELECTRIC
    }
    public enum Status {
        PENDING ,AVAILABLE, UNAVAILABLE, SUSPENDED
        // PENDING trạng thái xe chưa được duyệt
        // AVAILABLE trạng thái xe đang hoạt động
        // UNAVAILABLE trạng thái xe đã bị xóa
        // SUSPENDED trạng thái xe đang tạm khóa bởi chủ xe
    }
}