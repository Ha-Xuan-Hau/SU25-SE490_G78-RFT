package com.rft.rft_be.controller;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.mapper.RatingMapper;

import com.rft.rft_be.service.rating.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {
    private final RatingService ratingService;
    private final RatingMapper ratingMapper;

    @PostMapping
    public ResponseEntity<RatingDTO> createOrUpdate(@RequestBody RatingDTO dto) {
            return ResponseEntity.ok(ratingService.createOrUpdateRating(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        ratingService.deleteRating(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RatingDTO>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(ratingService.getRatingsByUserId(userId));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<RatingDTO>> getByVehicle(@PathVariable String vehicleId) {
        return ResponseEntity.ok(ratingService.getRatingsByVehicleId(vehicleId));
    }

    @GetMapping("/vehicle/{vehicleId}/comments")
    public ResponseEntity<List<UserCommentDTO>> getVehicleComments(@PathVariable String vehicleId) {
        return ResponseEntity.ok(ratingService.getUserCommentsByVehicleId(vehicleId));
    }

}
