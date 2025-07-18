package com.rft.rft_be.controller;

import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.service.user.UserService;
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
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(@PathVariable String id, @RequestBody UserProfileDTO dto) {
        UserProfileDTO updated = userService.updateProfile(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/get-user")
    public ResponseEntity<UserDTO> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        // Extract token from "Bearer <token>"
        String token = authHeader.substring(7);

        // Get user ID from token
        String userId = userService.getUserIdFromToken(token);

        // Use existing service to get user profile
        return ResponseEntity.ok(userService.getProfile(userId));
    }
}