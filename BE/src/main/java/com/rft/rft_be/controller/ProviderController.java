package com.rft.rft_be.controller;

import com.rft.rft_be.dto.user.RegisterProviderRequestDTO;
import com.rft.rft_be.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerAsProvider(@RequestBody RegisterProviderRequestDTO request) {
        userService.registerUserAsProvider(request);
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Đăng ký trở thành đối tác thành công.");

    }
}