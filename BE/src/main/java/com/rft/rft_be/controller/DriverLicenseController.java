package com.rft.rft_be.controller;

import com.rft.rft_be.dto.driverLicense.CreateDriverLicenseDTO;
import com.rft.rft_be.dto.driverLicense.DriverLicenseDTO;
import com.rft.rft_be.service.DriverLicense.DriverLicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver-licenses")
@RequiredArgsConstructor

public class DriverLicenseController {

    private final DriverLicenseService driverLicenseService;

    @GetMapping
    public ResponseEntity<?> getAllDriverLicenses() {
        try {
            List<DriverLicenseDTO> driverLicenses = driverLicenseService.getAllDriverLicenses();
            return ResponseEntity.ok(driverLicenses);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve driver licenses: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDriverLicenseById(@PathVariable String id) {
        try {
            DriverLicenseDTO driverLicense = driverLicenseService.getDriverLicenseById(id);
            return ResponseEntity.ok(driverLicense);
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

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getDriverLicensesByUserId(@PathVariable String userId) {
        try {
            List<DriverLicenseDTO> driverLicenses = driverLicenseService.getDriverLicensesByUserId(userId);
            return ResponseEntity.ok(driverLicenses);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve driver licenses for user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getDriverLicensesByStatus(@PathVariable String status) {
        try {
            List<DriverLicenseDTO> driverLicenses = driverLicenseService.getDriverLicensesByStatus(status);
            return ResponseEntity.ok(driverLicenses);
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

    @GetMapping("/license-number/{licenseNumber}")
    public ResponseEntity<?> getDriverLicenseByLicenseNumber(@PathVariable String licenseNumber) {
        try {
            DriverLicenseDTO driverLicense = driverLicenseService.getDriverLicenseByLicenseNumber(licenseNumber);
            return ResponseEntity.ok(driverLicense);
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

    @PostMapping
    public ResponseEntity<?> createDriverLicense(@RequestBody CreateDriverLicenseDTO createDriverLicenseDTO) {
        try {
            DriverLicenseDTO createdDriverLicense = driverLicenseService.createDriverLicense(createDriverLicenseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDriverLicense);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create driver license: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDriverLicense(@PathVariable String id, @RequestBody DriverLicenseDTO driverLicenseDTO) {
        try {
            DriverLicenseDTO updatedDriverLicense = driverLicenseService.updateDriverLicense(id, driverLicenseDTO);
            return ResponseEntity.ok(updatedDriverLicense);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update driver license: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDriverLicense(@PathVariable String id) {
        try {
            driverLicenseService.deleteDriverLicense(id);
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
            error.put("error", "Failed to delete driver license: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "DriverLicenseController");
        return ResponseEntity.ok(response);
    }

    // Count endpoint
    @GetMapping("/count")
    public ResponseEntity<?> getDriverLicenseCount() {
        try {
            List<DriverLicenseDTO> allLicenses = driverLicenseService.getAllDriverLicenses();
            Map<String, Object> response = new HashMap<>();
            response.put("total", allLicenses.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get count: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Count by status endpoint
    @GetMapping("/count/status/{status}")
    public ResponseEntity<?> getDriverLicenseCountByStatus(@PathVariable String status) {
        try {
            List<DriverLicenseDTO> licenses = driverLicenseService.getDriverLicensesByStatus(status);
            Map<String, Object> response = new HashMap<>();
            response.put("status", status.toUpperCase());
            response.put("count", licenses.size());
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
}
