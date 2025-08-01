package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.service.vehicle.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Slf4j
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<List<VehicleCardDetailDTO>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleGetDTO> getVehicleById(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<VehicleDetailDTO> getVehicleDetail(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleDetailById(id));
    }

    //    @GetMapping("/getAllByCategory")
//    public ResponseEntity<List<CategoryDTO>> getAllVehiclesByCategory() {
//        return ResponseEntity.ok(vehicleService.getAllVehiclesByCategory());
//    }
//    @GetMapping("/available")
//    public ResponseEntity<List<VehicleDTO>> getAvailableVehicles() {
//        return ResponseEntity.ok(vehicleService.getAllAvailableVehicles());
//    }

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
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by type: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/have-driver/{haveDriver}")
    public ResponseEntity<?> getVehiclesByHaveDriver(@PathVariable String haveDriver) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByHaveDriver(haveDriver);
            return ResponseEntity.ok(vehicles);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by driver availability: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/vehicle-type/{vehicleType}/status/{status}")
    public ResponseEntity<?> getVehiclesByVehicleTypeAndStatus(@PathVariable String vehicleType, @PathVariable String status) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByVehicleTypeAndStatus(vehicleType, status);
            return ResponseEntity.ok(vehicles);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by type and status: " + e.getMessage());
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


//    @PostMapping
//    public ResponseEntity<?> createVehicle(@RequestBody CreateVehicleDTO createVehicleDTO) {
//        try {
//            if(createVehicleDTO.getIsMultipleVehicles()){
//                List<VehicleGetDTO> createdVehicleList = vehicleService.createVehicleBulk(createVehicleDTO);
//                return ResponseEntity.status(HttpStatus.CREATED).body(createdVehicleList);
//            }else{
//                VehicleGetDTO createdVehicle = vehicleService.createVehicle(createVehicleDTO);
//                return ResponseEntity.status(HttpStatus.CREATED).body(createdVehicle);
//            }
//        } catch (RuntimeException e) {
//            Map<String, String> error = new HashMap<>();
//            error.put("error", e.getMessage());
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
//        } catch (Exception e) {
//            Map<String, String> error = new HashMap<>();
//            error.put("error", "Failed to create vehicle: " + e.getMessage());
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
//        }
//    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable String id, @RequestBody VehicleGetDTO vehicleDTO) {
        try {
            VehicleGetDTO updatedVehicle = vehicleService.updateVehicle(id, vehicleDTO);
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

    @GetMapping("/penalty/{penaltyId}")
    public ResponseEntity<?> getVehiclesByPenaltyId(@PathVariable String penaltyId) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getVehiclesByPenaltyId(penaltyId);
            return ResponseEntity.ok(vehicles);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve vehicles by penalty: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Count endpoint
    @GetMapping("/count")
    public ResponseEntity<?> getVehicleCount() {
        try {
            List<VehicleCardDetailDTO> allVehicles = vehicleService.getAllVehicles();
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

    @PostMapping("/search")
    public ResponseEntity<?> search(@Valid @RequestBody VehicleSearchDTO request) {
        try {
            // Parse time
            LocalDateTime timeFrom = request.getPickupDateTime() != null ? LocalDateTime.parse(request.getPickupDateTime()) : null;
            LocalDateTime timeTo = request.getReturnDateTime() != null ? LocalDateTime.parse(request.getReturnDateTime()) : null;

            if (timeFrom != null && timeTo != null && timeFrom.isAfter(timeTo)) {
                return ResponseEntity.badRequest().body("pickupTime must be before returnTime");
            }
            Page<VehicleSearchResultDTO> results = vehicleService.searchVehicles(request, timeFrom, timeTo);

            Map<String, Object> response = new HashMap<>();
            response.put("content", results.getContent());
            response.put("totalElements", results.getTotalElements());
            response.put("totalPages", results.getTotalPages());
            response.put("currentPage", results.getNumber());
            response.put("size", results.getSize());

            return ResponseEntity.ok(response);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z");
        }
    }
    @PostMapping("/search-basic")
    public ResponseEntity<?> basicSearch(@RequestBody BasicSearchDTO request) {
        try {
            LocalDateTime pickupTime = parseDateTimeSafe(request.getPickupDateTime());
            LocalDateTime returnTime = parseDateTimeSafe(request.getReturnDateTime());

            if (pickupTime != null && returnTime != null && pickupTime.isAfter(returnTime)) {
                return ResponseEntity.badRequest().body("pickupDateTime must be before returnDateTime");
            }

            Pageable pageable = PageRequest.of(
                    Math.max(request.getPage(), 0),
                    Math.max(request.getSize(), 1)
            );

            Page<VehicleSearchResultDTO> results = vehicleService.basicSearch(
                    request.getAddress(),
                    request.getVehicleType(),
                    pickupTime,
                    returnTime,
                    pageable
            );

            Map<String, Object> response = new HashMap<>();
            response.put("content", results.getContent());
            response.put("totalElements", results.getTotalElements());
            response.put("totalPages", results.getTotalPages());
            response.put("currentPage", results.getNumber());
            response.put("size", results.getSize());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid datetime format: " + e.getMessage());
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Search failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Hàm parse an toàn
    private LocalDateTime parseDateTimeSafe(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDateTime.parse(raw);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(raw);
        }
    }

    @PostMapping("/available-thumb-quantity")
    public ResponseEntity<AvailableVehicleQuantityOnlyDTO> getAvailableQuantityByThumb(
            @RequestBody VehicleAvailabilityByThumbRequestDTO req) {

        return ResponseEntity.ok(vehicleService.getQuantityOfAvailableVehiclesByThumb(
                req.getThumb(), req.getProviderId(), req.getFrom(), req.getTo()));
    }

    @PostMapping("/available-thumb-list")
    public ResponseEntity<AvailableVehicleListWithQuantityDTO> getAvailableListByThumb(
            @RequestBody VehicleAvailabilityByThumbRequestDTO req) {

        return ResponseEntity.ok(vehicleService.getListAndQuantityOfAvailableVehiclesByThumb(
                req.getThumb(), req.getProviderId(), req.getFrom(), req.getTo()));
    }
    @GetMapping("/users/{userId}/available/{vehicleType}")
    public ResponseEntity<?> getUserAvailableVehiclesByType(
            @PathVariable String userId,
            @PathVariable String vehicleType) {
        try {
            List<VehicleGetDTO> vehicles = vehicleService.getUserAvailableVehiclesByType(userId, vehicleType);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("vehicleType", vehicleType.toUpperCase());
            response.put("status", "AVAILABLE");
            response.put("vehicles", vehicles);
            response.put("count", vehicles.size());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Lỗi khi tìm kiếm xe có sẵn cho người dùng: {} với loại: {}", userId, vehicleType, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Lỗi khi tìm kiếm xe có sẵn cho người dùng: {} với loại: {}", userId, vehicleType, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy lại xe có sẵn: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
