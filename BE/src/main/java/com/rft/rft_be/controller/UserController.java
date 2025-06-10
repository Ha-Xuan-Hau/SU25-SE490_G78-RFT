package com.rft.rft_be.controller;

import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserDTO> viewProfile(@PathVariable String id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }
}