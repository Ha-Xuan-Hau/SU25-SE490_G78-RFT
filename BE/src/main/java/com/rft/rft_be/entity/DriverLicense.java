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
public class DriverLicense {
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

    @ColumnDefault("0")
    @Enumerated(EnumType.ORDINAL)  // Sử dụng ORDINAL
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

    public enum Status {
        EXPIRED,    // 0
        VALID// 1
    }
}
//update database

//UPDATE driver_licenses SET status = 0 WHERE status = 'VALID';
//UPDATE driver_licenses SET status = 1 WHERE status = 'EXPIRED';
//
//-- Đảm bảo column type là số
//ALTER TABLE driver_licenses MODIFY COLUMN status TINYINT DEFAULT 0;
//        SELECT id, status FROM driver_licenses WHERE status NOT IN (0, 1);
//
//-- Clean data không hợp lệ (set về VALID = 0)
//UPDATE driver_licenses SET status = 0 WHERE status NOT IN (0, 1);