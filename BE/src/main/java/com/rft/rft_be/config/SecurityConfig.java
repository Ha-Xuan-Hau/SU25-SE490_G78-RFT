package com.rft.rft_be.config;

import java.util.Arrays;
import java.util.Collections;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/**", "/api/penalties/**", "/api/payment/vn-pay-callback",
            "/api/payment/topUpCallBack","/api/notifications/**", "/ws/**",  // Thêm WebSocket endpoint
            "/ws"
    };
    @Value("${jwt.signerKey}")
    private String signerKey;

    //    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
//        httpSecurity.authorizeHttpRequests(request ->
//                request.requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
//                        .anyRequest().authenticated());
//        httpSecurity.csrf(AbstractHttpConfigurer::disable);
//    return httpSecurity.build();
//    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration configuration = new CorsConfiguration();
                    configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
                    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    configuration.setAllowedHeaders(Collections.singletonList("*"));
                    configuration.setAllowCredentials(true);
                    configuration.setMaxAge(3600L);
                    return configuration;
                }))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(request


                                -> request
                                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/vehicles/**").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/vehicles/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/coupons/apply").authenticated()
                                .requestMatchers(HttpMethod.GET, "/api/bookedTimeSlot/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/wallet/staff/**").hasAnyRole("STAFF", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/reports/type/**").hasAnyRole("STAFF", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/reports/separate-by-target").hasAnyRole("STAFF", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/reports/search/user").hasAnyRole("STAFF", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/reports/search/vehicle").hasAnyRole("STAFF", "ADMIN")
                                .requestMatchers("/api/adminmanageusers/**").hasAnyRole("ADMIN","STAFF")
//                                .requestMatchers(HttpMethod.POST, "/api/bookings").authenticated()
//                                .requestMatchers(HttpMethod.POST, "/api/bookings/**").authenticated()
//                                .requestMatchers(HttpMethod.GET, "/api/bookings").hasAuthority("ADMIN")
//                                .requestMatchers(HttpMethod.GET, "/api/bookings/**").hasAuthority("ADMIN")
//                                .requestMatchers(HttpMethod.GET, "/api/vehicle-rent").hasAuthority("PROVIDER")
//                                .requestMatchers(HttpMethod.POST, "/api/vehicle-rent/register").hasAnyRole("PROVIDER","ADMIN")


                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                                .anyRequest().authenticated()

                );
        httpSecurity.oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwtConfigurer -> jwtConfigurer
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        .decoder(jwtDecoder())
                )
        );

        return httpSecurity.build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);

        return jwtAuthenticationConverter;
    }


    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    JwtDecoder jwtDecoder() {
        SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HS512");
        return NimbusJwtDecoder
                .withSecretKey(secretKeySpec)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

}
