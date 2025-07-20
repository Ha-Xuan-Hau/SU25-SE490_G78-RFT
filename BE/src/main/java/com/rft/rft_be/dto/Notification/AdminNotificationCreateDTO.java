package com.rft.rft_be.dto.Notification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotificationCreateDTO {

    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Message is required")
    private String message;

    private String redirectUrl;

    @NotEmpty(message = "At least one receiver is required")
    private List<String> receiverIds;

    private Boolean sendToAll;
}
