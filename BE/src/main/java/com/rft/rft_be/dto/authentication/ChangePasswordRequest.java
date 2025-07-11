package com.rft.rft_be.dto.authentication;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    private String password;
    private String newPassword;
    private String confirmPassword;
}
