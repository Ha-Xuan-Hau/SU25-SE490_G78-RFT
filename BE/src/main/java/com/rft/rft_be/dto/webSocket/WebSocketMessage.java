package com.rft.rft_be.dto.webSocket;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {
    private String eventType;      // NOTIFICATION, DATA_UPDATE, STATUS_CHANGE, etc.
    private Object payload;        // Data chính
    private Map<String, Object> metadata;  // Thông tin bổ sung
    private LocalDateTime timestamp;
}
