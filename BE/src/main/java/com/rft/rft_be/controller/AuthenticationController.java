package com.rft.rft_be.controller;

import com.nimbusds.jose.JOSEException;
import com.rft.rft_be.dto.authentication.AuthenticationRequest;
import com.rft.rft_be.dto.authentication.AuthenticationResponse;
import com.rft.rft_be.dto.authentication.IntrospectRequest;
import com.rft.rft_be.dto.authentication.IntrospectResponse;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.dto.user.UserRegisterDTO;
import com.rft.rft_be.mapper.UserMapper;
import com.rft.rft_be.service.authenticationService.AuthenticationService;
import com.rft.rft_be.service.user.UserService;
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

    @PostMapping("/register")
    public ResponseEntity<UserDetailDTO> register(@RequestBody UserRegisterDTO request){
        UserDetailDTO createdUser =userService.register(request);

        return ResponseEntity.ok(createdUser);
    }
}
