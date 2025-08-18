package com.rft.rft_be.dto.authentication;

import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String credential; // Google ID token
}