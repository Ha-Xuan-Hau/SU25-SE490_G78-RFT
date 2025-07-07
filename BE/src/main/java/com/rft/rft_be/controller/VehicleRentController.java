package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.ApiResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.service.vehicleRent.VehicleRentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/vehicle-rent")
@RequiredArgsConstructor
@Slf4j
public class VehicleRentController {

    private final VehicleRentService vehicleRentService;

    @GetMapping("/my-vehicles")
    public ResponseEntity<ApiResponseDTO<PageResponseDTO<VehicleDTO>>> getUserVehicles(
            @RequestHeader("User-Id") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        try {
            PageResponseDTO<VehicleDTO> vehicles = vehicleRentService.getUserVehicles(userId, page, size, sortBy, sortDir);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicles retrieved successfully", vehicles));
        } catch (Exception e) {
            log.error("Error retrieving vehicles for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Failed to retrieve vehicles: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> registerVehicle(
            @RequestHeader("User-Id") String userId,
            @Valid @RequestBody VehicleRentCreateDTO request) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.createVehicle(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDTO.success("Vehicle registered successfully", vehicle));
        } catch (Exception e) {
            log.error("Error registering vehicle for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Failed to register vehicle: " + e.getMessage()));
        }
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<ApiResponseDTO<VehicleDetailDTO>> getVehicleById(
            @RequestHeader("User-Id") String userId,
            @PathVariable String vehicleId) {

        try {
            VehicleDetailDTO vehicle = vehicleRentService.getVehicleById(userId, vehicleId);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle retrieved successfully", vehicle));
        } catch (Exception e) {
            log.error("Error retrieving vehicle: {} for user: {}", vehicleId, userId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponseDTO.error("Failed to retrieve vehicle: " + e.getMessage()));
        }
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> updateVehicle(
            @RequestHeader("User-Id") String userId,
            @PathVariable String vehicleId,
            @Valid @RequestBody VehicleRentUpdateDTO request) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.updateVehicle(userId, vehicleId, request);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle updated successfully", vehicle));
        } catch (Exception e) {
            log.error("Error updating vehicle: {} for user: {}", vehicleId, userId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Failed to update vehicle: " + e.getMessage()));
        }
    }
    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<ApiResponseDTO<Void>> deleteVehicle(
            @RequestHeader("User-Id") String userId,
            @PathVariable String vehicleId) {

        try {
            vehicleRentService.deleteVehicle(userId, vehicleId);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle deleted successfully", null));
        } catch (Exception e) {
            log.error("Error deleting vehicle: {} for user: {}", vehicleId, userId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Failed to delete vehicle: " + e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponseDTO<Long>> countUserVehicles(
            @RequestHeader("User-Id") String userId) {

        try {
            long count = vehicleRentService.countUserVehicles(userId);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle count retrieved successfully", count));
        } catch (Exception e) {
            log.error("Error counting vehicles for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Failed to count vehicles: " + e.getMessage()));
        }
    }
}