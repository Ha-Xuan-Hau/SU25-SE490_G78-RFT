package com.rft.rft_be.dto.authentication;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {
    private String email;
    private String newPassword;
    private String confirmPassword;
}
