package com.rft.rft_be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "driver_licenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverLicens {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "class", length = 20)
    private String classField;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.VALID;

    @Lob
    @Column(name = "image")
    private String image;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private Instant createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum Status{
        VALID, EXPIRED
    }
}