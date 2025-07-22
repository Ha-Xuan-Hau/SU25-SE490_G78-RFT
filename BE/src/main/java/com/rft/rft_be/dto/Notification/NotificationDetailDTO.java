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
public class NotificationDetailDTO {
    private String id;
    private String type;
    private String message; // Parsed message text
    private String redirectUrl; // Parsed redirect URL
    private Boolean isRead;
    private Boolean isDeleted;
    private String receiverId;
    private String receiverName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
