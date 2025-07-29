package com.rft.rft_be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "extra_fee_rule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtraFeeRule {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ColumnDefault("0")
    @Column(name = "max_km_per_day")
    private Integer maxKmPerDay;

    @ColumnDefault("0")
    @Column(name = "fee_per_extra_km")
    private Integer feePerExtraKm;

    @ColumnDefault("0")
    @Column(name = "allowed_hour_late")
    private Integer allowedHourLate;

    @ColumnDefault("0")
    @Column(name = "fee_per_extra_hour")
    private Integer feePerExtraHour;

    @ColumnDefault("0")
    @Column(name = "cleaning_fee")
    private Integer cleaningFee;

    @ColumnDefault("0")
    @Column(name = "smell_removal_fee")
    private Integer smellRemovalFee;

    @ColumnDefault("0")
    @Column(name = "battery_charge_fee_per_percent")
    private Integer batteryChargeFeePerPercent;

    @ColumnDefault("0")
    @Column(name = "apply_battery_charge_fee")
    private Boolean applyBatteryChargeFee;

    @ColumnDefault("0")
    @Column(name = "driver_fee_per_day")
    private Integer driverFeePerDay;

    @ColumnDefault("0")
    @Column(name = "has_driver_option")
    private Boolean hasDriverOption;

    @ColumnDefault("0")
    @Column(name = "driver_fee_per_hour")
    private Integer driverFeePerHour;

    @ColumnDefault("0")
    @Column(name = "has_hourly_rental")
    private Boolean hasHourlyRental;

}