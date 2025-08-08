package com.rft.rft_be.service.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi lệnh refresh trang wallet cho user
     */
    public void refreshWalletForUser(String userId) {
        sendRefreshMessage(userId, "wallet");
    }

    /**
     * Gửi lệnh refresh trang booking cho user
     */
    public void refreshBookingForUser(String userId) {
        sendRefreshMessage(userId, "booking");
    }

    /**
     * Gửi lệnh refresh trang vehicle cho user
     */
    public void refreshVehicleForUser(String userId) {
        sendRefreshMessage(userId, "vehicle");
    }

    /**
     * Gửi lệnh refresh notifications cho user
     */
    public void refreshNotificationForUser(String userId) {
        sendRefreshMessage(userId, "notification");
    }

    /**
     * Gửi refresh message chung
     */
    private void sendRefreshMessage(String userId, String target) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "refresh");
            message.put("action", "refresh");
            message.put("target", target);
            message.put("userId", userId);
            
            messagingTemplate.convertAndSendToUser(userId, "/queue/refresh", message);
            log.info("Sent refresh message to user {} for target: {}", userId, target);
        } catch (Exception e) {
            log.error("Error sending refresh message to user {} for target {}: {}", userId, target, e.getMessage(), e);
        }
    }

    // Legacy methods for backward compatibility - now they just call refresh
    public void sendWalletUpdateToUser(String userId, String message, Map<String, Object> walletData) {
        log.info("Wallet update for user {}: {}", userId, message);
        refreshWalletForUser(userId);
    }

    public void sendBookingUpdateToUser(String userId, String message, Map<String, Object> bookingData) {
        log.info("Booking update for user {}: {}", userId, message);
        refreshBookingForUser(userId);
    }

    public void sendVehicleStatusToUser(String userId, String message, Map<String, Object> vehicleData) {
        log.info("Vehicle update for user {}: {}", userId, message);
        refreshVehicleForUser(userId);
    }

    public void sendNotificationToUser(String userId, String title, String message, String notificationId, String redirectUrl) {
        log.info("Notification for user {}: {}", userId, message);
        refreshNotificationForUser(userId);
    }

    public void sendBroadcastNotification(String title, String message, Map<String, Object> data) {
        log.info("Broadcast notification: {}", message);
        // For broadcast, you might want to refresh for all connected users
        // This is a simplified version
    }

    public void sendAdminUpdate(String message, Map<String, Object> data) {
        log.info("Admin update: {}", message);
    }
}
