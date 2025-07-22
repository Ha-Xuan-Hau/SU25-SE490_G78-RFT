package com.rft.rft_be.dto.admin;

import com.rft.rft_be.entity.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationDTO {
    private String id;
    private String type;
    private String message;
    private String redirectUrl;
    private Boolean isRead;
    private Boolean isDeleted;
    private String receiverId;
    private String receiverName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static AdminNotificationDTO fromEntity(Notification notification) {
        String parsedMessage = "";
        String redirectUrl = "";
        
        try {
            // Parse the JSON message to extract actual message and redirectUrl
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> messageMap = objectMapper.readValue(notification.getMessage(), Map.class);
            parsedMessage = (String) messageMap.get("message");
            redirectUrl = (String) messageMap.get("redirectUrl");
        } catch (Exception e) {
            // If parsing fails, use the original message
            parsedMessage = notification.getMessage();
        }
        
        return AdminNotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .message(parsedMessage)
                .redirectUrl(redirectUrl)
                .isRead(notification.getIsRead())
                .isDeleted(notification.getIsDeleted())
                .receiverId(notification.getReceiver().getId())
                .receiverName(notification.getReceiver().getFullName())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }
} 