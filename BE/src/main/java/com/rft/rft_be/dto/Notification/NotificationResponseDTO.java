package com.rft.rft_be.dto.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private String id;
    private String type;
    private String message; // JSON string
    private Boolean isRead;
    private Boolean isDeleted;
    private String receiverId;
    private String receiverName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
