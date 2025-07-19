package com.rft.rft_be.dto.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessageContent {
    private String message;
    private String redirectUrl; // URL để redirect khi click notification
}
