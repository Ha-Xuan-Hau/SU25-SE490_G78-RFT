package com.rft.rft_be.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "penalties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Penalty {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "penalty_type")
    private PenaltyType penaltyType;

    @Column(name = "penalty_value", precision = 10, scale = 2)
    private BigDecimal penaltyValue;

    @Column(name = "min_cancel_hour")
    private Integer minCancelHour;

    public enum PenaltyType {
        PERCENT, FIXED
    }

}