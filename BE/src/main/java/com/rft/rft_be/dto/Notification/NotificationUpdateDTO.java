package com.rft.rft_be.dto.Notification;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationUpdateDTO {
    private String type;
    private String message;
    private String redirectUrl;
    private Boolean isRead;
    private Boolean isDeleted;
}
