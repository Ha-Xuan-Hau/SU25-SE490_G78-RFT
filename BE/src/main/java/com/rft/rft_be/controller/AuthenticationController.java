package com.rft.rft_be.controller;

import com.nimbusds.jose.JOSEException;
import com.rft.rft_be.dto.authentication.*;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.dto.user.UserRegisterDTO;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.service.AuthenticationService.AuthenticationService;
import com.rft.rft_be.service.otp.OtpService;
import com.rft.rft_be.service.user.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;
    OtpService otpService;
    UserMapper userMapper;
    UserService userService;

    @PostMapping("/login")
    AuthenticationResponse authenticate(@RequestBody AuthenticationRequest request){
        AuthenticationResponse result = authenticationService.authenticate(request);
        return result;
    }

    @PostMapping("/introspect")
    IntrospectResponse authenticate(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        IntrospectResponse result = authenticationService.introspect(request);
        return result;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        authenticationService.sendForgotPasswordOtpEmail(request.getEmail());
        // Gửi mail ở đây
        return ResponseEntity.ok("OTP sent: " + request.getEmail());
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpRequest request) {
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(isValid ? "OTP verified" : "OTP invalid");
    }

    @PostMapping("/register")
    public ResponseEntity<UserDetailDTO> register(@RequestBody UserRegisterDTO request){
        UserDetailDTO createdUser =userService.register(request);

        return ResponseEntity.ok(createdUser);
    }

}
