package com.rft.rft_be.dto.authentication;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SentOtpRequest {
    @NotBlank(message = "Email should not be null or blank")
    @Email(message = "Invalid email")
    private String email;
}
