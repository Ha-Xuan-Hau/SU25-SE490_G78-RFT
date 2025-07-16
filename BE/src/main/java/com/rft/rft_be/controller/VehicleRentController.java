package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.vehicleRent.*;
import com.rft.rft_be.dto.vehicle.*;

import com.rft.rft_be.service.vehicleRent.VehicleRentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicle-rent")
@RequiredArgsConstructor
@Slf4j
public class VehicleRentController {

    private final VehicleRentService vehicleRentService;


    @GetMapping("/my-vehicles")
    public ResponseEntity<ApiResponseDTO<PageResponseDTO<VehicleDTO>>> getUserVehicles(

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        try {
            PageResponseDTO<VehicleDTO> vehicles = vehicleRentService.getUserVehicles( page, size, sortBy, sortDir);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicles retrieved successfully", vehicles));
        } catch (Exception e) {
            log.error("Error retrieving vehicles for user: {}",  e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Failed to retrieve vehicles: " + e.getMessage()));
        }
    }


    @PostMapping("/register")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> registerVehicle(

            @Valid @RequestBody VehicleRentCreateDTO request) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.createVehicle( request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDTO.success("Vehicle registered successfully", vehicle));
        } catch (Exception e) {
            log.error("Error registering vehicle for user: {}", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Failed to register vehicle: " + e.getMessage()));
        }
    }


    @GetMapping("/{vehicleId}")
    public ResponseEntity<ApiResponseDTO<VehicleDetailDTO>> getVehicleById(

            @PathVariable String vehicleId) {

        try {
            VehicleDetailDTO vehicle = vehicleRentService.getVehicleById(vehicleId);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle retrieved successfully", vehicle));
        } catch (Exception e) {
            log.error("Error retrieving vehicle: {} for user: {}", vehicleId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponseDTO.error("Failed to retrieve vehicle: " + e.getMessage()));
        }
    }


    @PutMapping("/{vehicleId}")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> updateVehicle(

            @PathVariable String vehicleId,
            @Valid @RequestBody VehicleRentUpdateDTO request) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.updateVehicle( vehicleId, request);
            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle updated successfully", vehicle));
        } catch (Exception e) {
            log.error("Error updating vehicle: {} for user: {}", vehicleId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Failed to update vehicle: " + e.getMessage()));
        }
    }



//    @DeleteMapping("/{vehicleId}")
//    public ResponseEntity<ApiResponseDTO<Void>> deleteVehicle(
//
//            @PathVariable String vehicleId) {
//
//        try {
//            vehicleRentService.deleteVehicle( vehicleId);
//            return ResponseEntity.ok(ApiResponseDTO.success("Vehicle deleted successfully", null));
//        } catch (Exception e) {
//            log.error("Error deleting vehicle: {} for user: {}", vehicleId,  e);
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(ApiResponseDTO.error("Failed to delete vehicle: " + e.getMessage()));
//        }
//    }


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

    @PutMapping("/{vehicleId}/toggle-status")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> toggleVehicleStatus(
            @PathVariable String vehicleId) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.toggleVehicleStatus( vehicleId);
            return ResponseEntity.ok(ApiResponseDTO.success("Đã chuyển đổi trạng thái xe thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi chuyển đổi trạng thái xe: {} cho người dùng: {}", vehicleId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể chuyển đổi trạng thái xe: " + e.getMessage()));
        }
    }
    @PostMapping("/registerBulk")
    public ResponseEntity<?> registerBulk(@Valid @RequestBody VehicleRentCreateDTO dto){
        try {
            VehicleGetDTO createdVehicle = vehicleRentService.createVehicle(dto);
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
    @PostMapping("/create-or-update-number")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> createOrUpdateVehicleWithNumber(@Valid @RequestBody VehicleRentCreateDTO request) {
        try {
            VehicleGetDTO vehicle = vehicleRentService.createOrUpdateVehicleWithNumberVehicle(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDTO.success("Tạo/cập nhật xe thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi tạo/cập nhật xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể tạo/cập nhật xe: " + e.getMessage()));
        }
    }

    @PutMapping("/{vehicleId}/update-common")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> updateCommonVehicleInfo(@PathVariable String vehicleId, @Valid @RequestBody VehicleRentUpdateDTO request) {
        try {
            VehicleGetDTO vehicle = vehicleRentService.updateCommonVehicleInfo(vehicleId, request);
            return ResponseEntity.ok(ApiResponseDTO.success("Cập nhật thông tin chung thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật thông tin chung: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể cập nhật thông tin chung: " + e.getMessage()));
        }
    }

    @PutMapping("/{vehicleId}/update-specific")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> updateSpecificVehicleInfo(@PathVariable String vehicleId, @Valid @RequestBody VehicleRentUpdateDTO request) {
        try {
            VehicleGetDTO vehicle = vehicleRentService.updateSpecificVehicleInfo(vehicleId, request);
            return ResponseEntity.ok(ApiResponseDTO.success("Cập nhật thông tin riêng thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật thông tin riêng: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể cập nhật thông tin riêng: " + e.getMessage()));
        }
    }

    @GetMapping("/my-motorbike")
    public ResponseEntity<ApiResponseDTO<List<VehicleThumbGroupDTO>>> getMyMotorbikeGrouped() {
        try {
            List<VehicleThumbGroupDTO> data = vehicleRentService.getProviderMotorbikeGroupedByThumb();
            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe máy thành công", data));
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách nhóm xe máy: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe máy: " + e.getMessage()));
        }
    }

    @GetMapping("/my-bicycle")
    public ResponseEntity<ApiResponseDTO<List<VehicleThumbGroupDTO>>> getMyBicycleGrouped() {
        try {
            List<VehicleThumbGroupDTO> data = vehicleRentService.getProviderBicycleGroupedByThumb();
            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe đạp thành công", data));
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách nhóm xe đạp: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe đạp: " + e.getMessage()));
        }
    }

    @GetMapping("/my-motorbike-bicycle")
    public ResponseEntity<ApiResponseDTO<List<VehicleThumbGroupDTO>>> getMyMotorbikeAndBicycleGrouped() {
        try {
            List<VehicleThumbGroupDTO> data = vehicleRentService.getProviderMotorbikeAndBicycleGroupedByThumb();
            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe thành công", data));
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách nhóm xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe: " + e.getMessage()));
        }
    }

}
