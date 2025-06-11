package com.rft.rft_be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;

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
    private Instant timeBookingStart;

    @Column(name = "time_booking_end")
    private Instant timeBookingEnd;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Lob
    @Column(name = "address")
    private String address;

    @Column(name = "code_transaction", length = 100)
    private String codeTransaction;

    @Column(name = "time_transaction")
    private Instant timeTransaction;

    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.PENDING;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum Status{
            PENDING, CONFIRMED, CANCELLED, COMPLETED
    }
}