package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.service.vehicle.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDTO> getVehicleById(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<VehicleDetailDTO> getVehicleDetail(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleDetailById(id));
    }

    @GetMapping("/getAllByCategory")
    public ResponseEntity<List<CategoryDTO>> getAllVehiclesByCategory() {
        return ResponseEntity.ok(vehicleService.getAllVehiclesByCategory());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getVehiclesByUserId(@PathVariable String userId) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByUserId(userId);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles for user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getVehiclesByStatus(@PathVariable String status) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByStatus(status);
            return ResponseEntity.ok(vehicles);
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

    @GetMapping("/vehicle-type/{vehicleType}")
    public ResponseEntity<?> getVehiclesByVehicleType(@PathVariable String vehicleType) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByVehicleType(vehicleType);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by type: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/brand/{brandId}")
    public ResponseEntity<?> getVehiclesByBrandId(@PathVariable String brandId) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByBrandId(brandId);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by brand: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/model/{modelId}")
    public ResponseEntity<?> getVehiclesByModelId(@PathVariable String modelId) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByModelId(modelId);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by model: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/license-plate/{licensePlate}")
    public ResponseEntity<?> getVehicleByLicensePlate(@PathVariable String licensePlate) {
        try {
            VehicleGetDTO vehicle = vehicleService.getVehicleByLicensePlate(licensePlate);
            return ResponseEntity.ok(vehicle);
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
    public ResponseEntity<?> createVehicle(@RequestBody com.rft.rft_be.dto.vehicle.CreateVehicleDTO createVehicleDTO) {
        try {
            VehicleGetDTO createdVehicle = vehicleService.createVehicle(createVehicleDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdVehicle);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create vehicle: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable String id, @RequestBody VehicleGetDTO vehicleGetDTO_) {
        try {
            VehicleGetDTO updatedVehicle = vehicleService.updateVehicle(id, vehicleGetDTO_);
            return ResponseEntity.ok(updatedVehicle);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());

            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update vehicle: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable String id) {
        try {
            vehicleService.deleteVehicle(id);
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
            error.put("error", "Failed to delete vehicle: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "VehicleController");
        return ResponseEntity.ok(response);
    }

    // Count endpoint
    @GetMapping("/count")
    public ResponseEntity<?> getVehicleCount() {
        try {
            List<VehicleDTO> allVehicles = vehicleService.getAllVehicles();
            Map<String, Object> response = new HashMap<>();
            response.put("total", allVehicles.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get count: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Count by status endpoint
    @GetMapping("/count/status/{status}")
    public ResponseEntity<?> getVehicleCountByStatus(@PathVariable String status) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByStatus(status);
            Map<String, Object> response = new HashMap<>();
            response.put("status", status.toUpperCase());
            response.put("count", vehicles.size());
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
