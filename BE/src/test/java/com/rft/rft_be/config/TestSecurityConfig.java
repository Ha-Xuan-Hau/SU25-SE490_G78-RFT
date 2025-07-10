package com.rft.rft_be.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    public JwtDecoder jwtDecoder() {
        JwtDecoder mockDecoder = mock(JwtDecoder.class);

        Map<String, Object> claims = new HashMap<>();
        claims.put(JwtClaimNames.SUB, "testuser");
        claims.put("userId", "user-001");

        Jwt jwt = new Jwt("token", Instant.now(), Instant.now().plusSeconds(3600), Map.of("alg", "none"), claims);

        when(mockDecoder.decode("test-token")).thenReturn(jwt);

        return mockDecoder;
    }
}