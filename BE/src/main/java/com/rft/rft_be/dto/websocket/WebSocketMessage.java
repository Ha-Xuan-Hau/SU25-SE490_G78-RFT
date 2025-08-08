package com.rft.rft_be.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {
    private String type;
    private String title;
    private String message;
    private String userId;
    private Map<String, Object> data;
    private LocalDateTime timestamp;
    private String notificationId;
    private String redirectUrl;
    
    public static WebSocketMessage notification(String userId, String title, String message, String notificationId, String redirectUrl) {
        return WebSocketMessage.builder()
                .type("NOTIFICATION")
                .title(title)
                .message(message)
                .userId(userId)
                .timestamp(LocalDateTime.now())
                .notificationId(notificationId)
                .redirectUrl(redirectUrl)
                .build();
    }
    
    public static WebSocketMessage bookingUpdate(String userId, String message, Map<String, Object> bookingData) {
        return WebSocketMessage.builder()
                .type("BOOKING_UPDATE")
                .title("Cập nhật đặt xe")
                .message(message)
                .userId(userId)
                .data(bookingData)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static WebSocketMessage walletUpdate(String userId, String message, Map<String, Object> walletData) {
        return WebSocketMessage.builder()
                .type("WALLET_UPDATE")
                .title("Cập nhật ví")
                .message(message)
                .userId(userId)
                .data(walletData)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static WebSocketMessage vehicleStatus(String userId, String message, Map<String, Object> vehicleData) {
        return WebSocketMessage.builder()
                .type("VEHICLE_STATUS")
                .title("Cập nhật xe")
                .message(message)
                .userId(userId)
                .data(vehicleData)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
