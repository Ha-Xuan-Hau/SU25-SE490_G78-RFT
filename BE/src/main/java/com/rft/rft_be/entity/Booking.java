package com.rft.rft_be.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "time_booking_start")
    private LocalDateTime timeBookingStart;

    @Column(name = "time_booking_end")
    private LocalDateTime timeBookingEnd;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Lob
    @Column(name = "address")
    private String address;

    @Column(name = "code_transaction", length = 100)
    private String codeTransaction;

    @Column(name = "time_transaction")
    private LocalDateTime timeTransaction;

    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private Status status = Status.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "penalty_type")
    private PenaltyType penaltyType;

    @Column(name = "penalty_value", precision = 10, scale = 2)
    private BigDecimal penaltyValue;

    @Column(name = "min_cancel_hour")
    private Integer minCancelHour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        UNPAID, PENDING, CONFIRMED, CANCELLED, DELIVERED,
        RECEIVED_BY_CUSTOMER, RETURNED, COMPLETED
    }

    public enum PenaltyType {
        PERCENT, FIXED
    }
}
