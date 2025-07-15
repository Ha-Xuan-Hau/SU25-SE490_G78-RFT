package com.rft.rft_be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotNull
    @Lob
    @Column(name = "type", nullable = false)
    private String type;

    @NotNull
    @Lob
    @Column(name = "message", nullable = false)
    private String message;

    @ColumnDefault("0")
    @Column(name = "is_read")
    private Boolean isRead;

    @ColumnDefault("0")
    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @CreationTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

}