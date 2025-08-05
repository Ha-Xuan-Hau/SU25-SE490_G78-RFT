package com.rft.rft_be.util;

import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;

public class JwtUtil {
    public String extractUserIdFromToken(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet().getStringClaim("userId");
        } catch (ParseException e) {
            throw new RuntimeException("Không thể lấy userId từ token", e);
        }
    }
}
