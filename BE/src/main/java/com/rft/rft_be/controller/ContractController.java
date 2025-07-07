package com.rft.rft_be.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.CreateContractDTO;
import com.rft.rft_be.service.Contract.ContractService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor

public class ContractController {

    private final ContractService contractService;

    @GetMapping
    public ResponseEntity<?> getAllContracts() {
        try {
            List<ContractDTO> contracts = contractService.getAllContracts();
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve contracts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContractById(@PathVariable String id) {
        try {
            ContractDTO contract = contractService.getContractById(id);
            return ResponseEntity.ok(contract);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getContractsByBookingId(@PathVariable String bookingId) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByBookingId(bookingId);
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve contracts for booking: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getContractsByUserId(@PathVariable String userId) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByUserId(userId);
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve contracts for user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getContractsByStatus(@PathVariable String status) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByStatus(status);
            return ResponseEntity.ok(contracts);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/user/{userId}/status/{status}")
    public ResponseEntity<?> getContractsByUserIdAndStatus(@PathVariable String userId, @PathVariable String status) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByUserIdAndStatus(userId, status);
            return ResponseEntity.ok(contracts);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/booking/{bookingId}/status/{status}")
    public ResponseEntity<?> getContractsByBookingIdAndStatus(@PathVariable String bookingId, @PathVariable String status) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByBookingIdAndStatus(bookingId, status);
            return ResponseEntity.ok(contracts);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createContract(@RequestBody CreateContractDTO createContractDTO) {
        try {
            ContractDTO createdContract = contractService.createContract(createContractDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdContract);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateContract(@PathVariable String id, @RequestBody ContractDTO contractDTO) {
        try {
            ContractDTO updatedContract = contractService.updateContract(id, contractDTO);
            return ResponseEntity.ok(updatedContract);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContract(@PathVariable String id) {
        try {
            contractService.deleteContract(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete contract: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Count endpoint
    @GetMapping("/count")
    public ResponseEntity<?> getContractCount() {
        try {
            List<ContractDTO> allContracts = contractService.getAllContracts();
            Map<String, Object> response = new HashMap<>();
            response.put("total", allContracts.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get count: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Count by status endpoint
    @GetMapping("/count/status/{status}")
    public ResponseEntity<?> getContractCountByStatus(@PathVariable String status) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByStatus(status);
            Map<String, Object> response = new HashMap<>();
            response.put("status", status.toUpperCase());
            response.put("count", contracts.size());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get count by status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/provider/{providerId}/status/{status}")
    public ResponseEntity<?> getContractsByProviderIdAndStatus(@PathVariable String providerId, @PathVariable String status) {
        try {
            List<ContractDTO> contracts = contractService.getContractsByProviderIdAndStatus(providerId, status);
            return ResponseEntity.ok(contracts);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
