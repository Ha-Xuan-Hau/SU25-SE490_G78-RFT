package com.rft.rft_be.controller;


import com.rft.rft_be.dto.penalty.PenaltyDTO;
import com.rft.rft_be.dto.penalty.CreatePenaltyDTO;
import com.rft.rft_be.service.penalty.PenaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/penalties")
@RequiredArgsConstructor

public class PenaltyController {

    private final PenaltyService penaltyService;

    /**
     * 1. View the list of penalties by userId
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getPenaltiesByUserId(@PathVariable String userId) {
        try {
            log.info("Getting penalties for user: {}", userId);

            List<PenaltyDTO> penalties = penaltyService.getPenaltiesByUserId(userId);
            long count = penaltyService.countPenaltiesByUserId(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("penalties", penalties);
            response.put("count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting penalties for user: {}", userId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("userId", userId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 2. Create a new penalty
     */
    @PostMapping
    public ResponseEntity<?> createPenalty(@RequestBody CreatePenaltyDTO createPenaltyDTO) {
        try {
            log.info("Creating new penalty for user: {}", createPenaltyDTO.getUserId());

            PenaltyDTO createdPenalty = penaltyService.createPenalty(createPenaltyDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Penalty created successfully");
            response.put("penalty", createdPenalty);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Error creating penalty", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("createRequest", createPenaltyDTO);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 3. Edit an existing penalty
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePenalty(@PathVariable String id, @RequestBody PenaltyDTO penaltyDTO) {
        try {
            log.info("Updating penalty with id: {}", id);

            PenaltyDTO updatedPenalty = penaltyService.updatePenalty(id, penaltyDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Penalty updated successfully");
            response.put("penalty", updatedPenalty);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error updating penalty with id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("penaltyId", id);
            errorResponse.put("updateRequest", penaltyDTO);

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 4. Delete a penalty only if no vehicle is using it
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePenalty(@PathVariable String id) {
        try {
            log.info("Deleting penalty with id: {}", id);

            // Check if penalty is in use before attempting deletion
            boolean inUse = penaltyService.isPenaltyInUse(id);
            long vehicleCount = penaltyService.countVehiclesUsingPenalty(id);

            if (inUse) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Cannot delete penalty that is being used by vehicles. Please remove the penalty from all vehicles first.");
                errorResponse.put("penaltyId", id);
                errorResponse.put("vehicleCount", vehicleCount);
                errorResponse.put("canDelete", false);

                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }

            penaltyService.deletePenalty(id);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Penalty deleted successfully");
            response.put("deletedPenaltyId", id);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error deleting penalty with id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("penaltyId", id);

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            if (e.getMessage().contains("being used")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 5. View penalty details by id
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPenaltyById(@PathVariable String id) {
        try {
            log.info("Getting penalty details for id: {}", id);

            PenaltyDTO penalty = penaltyService.getPenaltyById(id);
            boolean inUse = penaltyService.isPenaltyInUse(id);
            long vehicleCount = penaltyService.countVehiclesUsingPenalty(id);

            Map<String, Object> response = new HashMap<>();
            response.put("penalty", penalty);
            response.put("inUse", inUse);
            response.put("vehicleCount", vehicleCount);
            response.put("canDelete", !inUse);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting penalty details for id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("penaltyId", id);

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Additional utility endpoints
     */

    @GetMapping("/{id}/usage")
    public ResponseEntity<?> checkPenaltyUsage(@PathVariable String id) {
        try {
            log.info("Checking usage for penalty: {}", id);

            boolean inUse = penaltyService.isPenaltyInUse(id);
            long vehicleCount = penaltyService.countVehiclesUsingPenalty(id);

            Map<String, Object> response = new HashMap<>();
            response.put("penaltyId", id);
            response.put("inUse", inUse);
            response.put("vehicleCount", vehicleCount);
            response.put("canDelete", !inUse);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error checking penalty usage for id: {}", id, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("penaltyId", id);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllPenalties() {
        try {
            log.info("Getting all penalties");

            List<PenaltyDTO> penalties = penaltyService.getAllPenalties();

            Map<String, Object> response = new HashMap<>();
            response.put("penalties", penalties);
            response.put("count", penalties.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting all penalties", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/type/{penaltyType}")
    public ResponseEntity<?> getPenaltiesByType(@PathVariable String penaltyType) {
        try {
            log.info("Getting penalties by type: {}", penaltyType);

            List<PenaltyDTO> penalties = penaltyService.getPenaltiesByType(penaltyType);
            long count = penaltyService.countPenaltiesByType(penaltyType);

            Map<String, Object> response = new HashMap<>();
            response.put("penaltyType", penaltyType);
            response.put("penalties", penalties);
            response.put("count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting penalties by type: {}", penaltyType, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("penaltyType", penaltyType);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<?> countPenaltiesByUserId(@PathVariable String userId) {
        try {
            log.info("Counting penalties for user: {}", userId);

            long count = penaltyService.countPenaltiesByUserId(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error counting penalties for user: {}", userId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("userId", userId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "PenaltyService");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}
