package com.rft.rft_be.dto.booking;

import com.rft.rft_be.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelBookingRequestDTO {

    private String reason;
    private User.Role userType;
    private boolean createFinalContract;
}
