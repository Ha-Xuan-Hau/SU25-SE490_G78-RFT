package com.rft.rft_be.controller;


import com.rft.rft_be.service.Contract.FinalContractService;
import com.rft.rft_be.dto.contract.FinalContractDTO;
import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/final-contracts")
@RequiredArgsConstructor

public class FinalContractController {

    private final FinalContractService finalContractService;

    @GetMapping
    public ResponseEntity<?> getAllFinalContracts() {
        try {
            List<FinalContractDTO> finalContracts = finalContractService.getAllFinalContracts();
            return ResponseEntity.ok(finalContracts);
        } catch (Exception e) {
            log.error("Error getting all final contracts", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve final contracts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFinalContractById(@PathVariable String id) {
        try {
            FinalContractDTO finalContract = finalContractService.getFinalContractById(id);
            return ResponseEntity.ok(finalContract);
        } catch (RuntimeException e) {
            log.error("Error getting final contract by id: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("Error getting final contract by id: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/contract/{contractId}")
    public ResponseEntity<?> getFinalContractsByContractId(@PathVariable String contractId) {
        try {
            List<FinalContractDTO> finalContracts = finalContractService.getFinalContractsByContractId(contractId);
            return ResponseEntity.ok(finalContracts);
        } catch (Exception e) {
            log.error("Error getting final contracts by contract id: {}", contractId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve final contracts for contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getFinalContractsByUserId(@PathVariable String userId) {
        try {
            List<FinalContractDTO> finalContracts = finalContractService.getFinalContractsByUserId(userId);
            return ResponseEntity.ok(finalContracts);
        } catch (Exception e) {
            log.error("Error getting final contracts by user id: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve final contracts for user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/user/{userId}/contract/{contractId}")
    public ResponseEntity<?> getFinalContractsByUserIdAndContractId(@PathVariable String userId, @PathVariable String contractId) {
        try {
            List<FinalContractDTO> finalContracts = finalContractService.getFinalContractsByUserIdAndContractId(userId, contractId);
            return ResponseEntity.ok(finalContracts);
        } catch (Exception e) {
            log.error("Error getting final contracts by user id: {} and contract id: {}", userId, contractId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve final contracts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/time-range")
    public ResponseEntity<?> getFinalContractsByTimeFinishBetween(
            @RequestParam Instant startDate,
            @RequestParam Instant endDate) {
        try {
            List<FinalContractDTO> finalContracts = finalContractService.getFinalContractsByTimeFinishBetween(startDate, endDate);
            return ResponseEntity.ok(finalContracts);
        } catch (Exception e) {
            log.error("Error getting final contracts by time range", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve final contracts by time range: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/cost-range")
    public ResponseEntity<?> getFinalContractsByCostSettlementRange(
            @RequestParam BigDecimal minCost,
            @RequestParam BigDecimal maxCost) {
        try {
            List<FinalContractDTO> finalContracts = finalContractService.getFinalContractsByCostSettlementRange(minCost, maxCost);
            return ResponseEntity.ok(finalContracts);
        } catch (Exception e) {
            log.error("Error getting final contracts by cost range", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve final contracts by cost range: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createFinalContract(@RequestBody CreateFinalContractDTO createFinalContractDTO) {
        try {
            FinalContractDTO createdFinalContract = finalContractService.createFinalContract(createFinalContractDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdFinalContract);
        } catch (RuntimeException e) {
            log.error("Error creating final contract", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error creating final contract", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create final contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFinalContract(@PathVariable String id, @RequestBody FinalContractDTO finalContractDTO) {
        try {
            FinalContractDTO updatedFinalContract = finalContractService.updateFinalContract(id, finalContractDTO);
            return ResponseEntity.ok(updatedFinalContract);
        } catch (RuntimeException e) {
            log.error("Error updating final contract with id: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error updating final contract with id: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update final contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFinalContract(@PathVariable String id) {
        try {
            finalContractService.deleteFinalContract(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting final contract with id: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error deleting final contract with id: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete final contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/count/user/{userId}")
    public ResponseEntity<?> countFinalContractsByUserId(@PathVariable String userId) {
        try {
            long count = finalContractService.countFinalContractsByUserId(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error counting final contracts for user: {}", userId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to count final contracts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/count/contract/{contractId}")
    public ResponseEntity<?> countFinalContractsByContractId(@PathVariable String contractId) {
        try {
            long count = finalContractService.countFinalContractsByContractId(contractId);
            Map<String, Object> response = new HashMap<>();
            response.put("contractId", contractId);
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error counting final contracts for contract: {}", contractId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to count final contracts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "FinalContractController");
        return ResponseEntity.ok(response);
    }

    // Count all final contracts
    @GetMapping("/count")
    public ResponseEntity<?> countAllFinalContracts() {
        try {
            List<FinalContractDTO> allFinalContracts = finalContractService.getAllFinalContracts();
            Map<String, Object> response = new HashMap<>();
            response.put("total", allFinalContracts.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to count final contracts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

