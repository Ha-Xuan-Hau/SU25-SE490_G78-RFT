package com.rft.rft_be.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.rft.rft_be.dto.webSocket.WebSocketMessage;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi event cho một user cụ thể
     */
    public void sendToUser(String userId, String eventType, Object payload) {
        WebSocketMessage message = WebSocketMessage.builder()
                .eventType(eventType)
                .payload(payload)
                .timestamp(LocalDateTime.now())
                .build();

        String destination = "/topic/user/" + userId;
        messagingTemplate.convertAndSend(destination, message);
        log.debug("Sent {} event to user {}", eventType, userId);
    }

    /**
     * Gửi event với metadata bổ sung
     */
    public void sendToUserWithMetadata(String userId, String eventType, Object payload, Map<String, Object> metadata) {
        WebSocketMessage message = WebSocketMessage.builder()
                .eventType(eventType)
                .payload(payload)
                .metadata(metadata)
                .timestamp(LocalDateTime.now())
                .build();

        String destination = "/topic/user/" + userId;
        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * Broadcast event cho tất cả users
     */
    public void broadcast(String eventType, Object payload) {
        WebSocketMessage message = WebSocketMessage.builder()
                .eventType(eventType)
                .payload(payload)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/broadcast", message);
        log.debug("Broadcasted {} event", eventType);
    }

    /**
     * Gửi event cho một channel/room cụ thể
     */
    public void sendToChannel(String channel, String eventType, Object payload) {
        WebSocketMessage message = WebSocketMessage.builder()
                .eventType(eventType)
                .payload(payload)
                .timestamp(LocalDateTime.now())
                .build();

        String destination = "/topic/channel/" + channel;
        messagingTemplate.convertAndSend(destination, message);
        log.debug("Sent {} event to channel {}", eventType, channel);
    }

    /**
     * Helper methods cho các event types phổ biến
     */
    public void notifyDataUpdate(String userId, String dataType, String dataId) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("dataType", dataType);
        metadata.put("dataId", dataId);

        sendToUserWithMetadata(userId, "DATA_UPDATE", null, metadata);
    }

    public void notifyStatusChange(String userId, String entityType, String entityId, String newStatus) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("entityType", entityType);
        payload.put("entityId", entityId);
        payload.put("newStatus", newStatus);

        sendToUser(userId, "STATUS_CHANGE", payload);
    }
}
