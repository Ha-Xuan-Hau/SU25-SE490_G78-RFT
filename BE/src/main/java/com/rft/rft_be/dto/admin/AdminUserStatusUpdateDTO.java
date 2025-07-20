package com.rft.rft_be.dto.admin;

import com.rft.rft_be.entity.User;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatusUpdateDTO {
    private User.Status status;
    private String reason;
} 