package com.rft.rft_be.controller;

import com.rft.rft_be.dto.vehicle.vehicleRent.*;
import com.rft.rft_be.dto.vehicle.*;

import com.rft.rft_be.service.WebSocketEventService;
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
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/vehicle-rent")
@RequiredArgsConstructor
@Slf4j
public class VehicleRentController {

    private final VehicleRentService vehicleRentService;
    private final WebSocketEventService webSocketEventService;


//    @GetMapping("/my-car")
//    public ResponseEntity<ApiResponseDTO<PageResponseDTO<VehicleGetDTO>>> getUserVehicles(
//
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(defaultValue = "createdAt") String sortBy,
//            @RequestParam(defaultValue = "desc") String sortDir) {
//
//        try {
//
//            PageResponseDTO<VehicleGetDTO> vehicles = vehicleRentService.getProviderCar( page, size, sortBy, sortDir);
//
//            return ResponseEntity.ok(ApiResponseDTO.success("Vehicles retrieved successfully", vehicles));
//        } catch (Exception e) {
//            log.error("Error retrieving vehicles for user: {}",  e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(ApiResponseDTO.error("Failed to retrieve vehicles: " + e.getMessage()));
//        }
//    }


    @PostMapping("/register")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> registerVehicle(

            @Valid @RequestBody VehicleRentCreateDTO request) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.createVehicle( request);
            webSocketEventService.reloadAdminDashboard();
            webSocketEventService.reloadVehiclesPending();
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDTO.success("Vehicle registered successfully", vehicle));
        } catch (Exception e) {
            log.error("Error registering vehicle for user: {}", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Failed to register vehicle: " + e.getMessage()));
        }
    }

    /**
     * Chuyển trạng thái hàng loạt cho xe máy và xe đạp (endpoint thay thế)
     * 
     * @param vehicleIds Danh sách ID của các xe cần chuyển trạng thái
     * @return Danh sách xe đã được cập nhật trạng thái
     */
    @PutMapping("/bulk-toggle-status")
    public ResponseEntity<ApiResponseDTO<List<VehicleGetDTO>>> bulkToggleVehicleStatus(
            @RequestBody List<String> vehicleIds) {
        try {
            // Validation cơ bản
            if (vehicleIds == null || vehicleIds.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponseDTO.error("Danh sách xe không được để trống"));
            }
            
            if (vehicleIds.size() > 50) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponseDTO.error("Chỉ được chọn tối đa 50 xe cùng lúc"));
            }
            
            List<VehicleGetDTO> data = vehicleRentService.toggleVehicleSuspendedBulk(vehicleIds);
            webSocketEventService.reloadAdminDashboard();
            webSocketEventService.reloadVehiclesPending();
            return ResponseEntity.ok(ApiResponseDTO.success("Chuyển trạng thái hàng loạt thành công cho " + data.size() + " xe", data));
        } catch (Exception e) {
            log.error("Lỗi bulk toggle status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể chuyển trạng thái hàng loạt: " + e.getMessage()));
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
            webSocketEventService.reloadAdminDashboard();
            return ResponseEntity.ok(ApiResponseDTO.success("Đã chuyển đổi trạng thái xe thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi chuyển đổi trạng thái xe: {} cho người dùng: {}", vehicleId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể chuyển đổi trạng thái xe: " + e.getMessage()));
        }
    }

    @PutMapping("/{vehicleId}/toggle-suspended")
    public ResponseEntity<ApiResponseDTO<VehicleGetDTO>> toggleVehicleSuspended(
            @PathVariable String vehicleId) {

        try {
            VehicleGetDTO vehicle = vehicleRentService.toggleVehicleSuspended(vehicleId);
            webSocketEventService.reloadAdminDashboard();
            return ResponseEntity.ok(ApiResponseDTO.success("Đã chuyển đổi trạng thái thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi chuyển trạng thái cho xe {}: {}", vehicleId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể chuyển trạng thái: " + e.getMessage()));
        }
    }
    @PostMapping("/registerBulk")
    public ResponseEntity<?> registerBulk(@Valid @RequestBody VehicleRentCreateDTO dto){
        try {
            VehicleGetDTO createdVehicle = vehicleRentService.createVehicle(dto);
            webSocketEventService.reloadAdminDashboard();
            webSocketEventService.reloadVehiclesPending();
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
    @PostMapping("/create-motorbike-bicycle")
    public ResponseEntity<ApiResponseDTO<List<VehicleGetDTO>>> createMotorbie_Bicycle(@Valid @RequestBody VehicleRentCreateDTO request) {
        try {
            List<VehicleGetDTO> vehicle = vehicleRentService.createMotorbie_Bicycle(request);
            webSocketEventService.reloadAdminDashboard();
            webSocketEventService.reloadVehiclesPending();
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDTO.success("Tạo xe thành công", vehicle));
        } catch (Exception e) {
            log.error("Lỗi khi tạo xe: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDTO.error("Không thể tạo xe: " + e.getMessage()));
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

    @GetMapping("/my-car")
    public ResponseEntity<ApiResponseDTO<PageResponseDTO<VehicleThumbGroupDTO>>> getMyCarGrouped(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir){
        try {
            PageResponseDTO<VehicleThumbGroupDTO> data = vehicleRentService.getProviderCarGrouped(page, size, sortBy, sortDir);
            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe ô tô thành công", data));

        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách nhóm xe ô tô: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe ô tô: " + e.getMessage()));
        }
    }

    @GetMapping("/my-motorbike")
    public ResponseEntity<ApiResponseDTO<PageResponseDTO<VehicleThumbGroupDTO>>> getMyMotorbikeGrouped(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir){
        try {
            PageResponseDTO<VehicleThumbGroupDTO> data = vehicleRentService.getProviderMotorbikeGroupedByThumb(page, size, sortBy, sortDir);
            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe máy thành công", data));

        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách nhóm xe máy: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe máy: " + e.getMessage()));
        }
    }

    @GetMapping("/my-bicycle")
    public ResponseEntity<ApiResponseDTO<PageResponseDTO<VehicleThumbGroupDTO>>> getMyBicycleGrouped(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        try {
            PageResponseDTO<VehicleThumbGroupDTO> data = vehicleRentService.getProviderBicycleGroupedByThumb(page, size, sortBy, sortDir);
            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe đạp thành công", data));
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách nhóm xe đạp: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe đạp: " + e.getMessage()));
        }
    }

//    @GetMapping("/my-motorbike-bicycle")
//    public ResponseEntity<ApiResponseDTO<List<VehicleThumbGroupDTO>>> getMyMotorbikeAndBicycleGrouped() {
//        try {
//            List<VehicleThumbGroupDTO> data = vehicleRentService.getProviderMotorbikeAndBicycleGroupedByThumb();
//            return ResponseEntity.ok(ApiResponseDTO.success("Lấy danh sách nhóm xe thành công", data));
//        } catch (Exception e) {
//            log.error("Lỗi khi lấy danh sách nhóm xe: {}", e.getMessage(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(ApiResponseDTO.error("Không thể lấy danh sách nhóm xe: " + e.getMessage()));
//        }
//    }

    /**
     * Lấy thống kê tổng quan cho provider hiện tại
     * @return ProviderStatisticsDTO chứa thông tin thống kê
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getProviderStatistics() {
        try {
            log.info("Nhận yêu cầu lấy thống kê provider");
            ProviderStatisticsDTO statistics = vehicleRentService.getProviderStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thống kê provider: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy thống kê: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Lấy thống kê theo tháng cho provider hiện tại
     * @param month tháng (1-12)
     * @param year năm
     * @return MonthlyStatisticsDTO chứa thông tin thống kê theo tháng
     */
    @GetMapping("/statistics/monthly")
    public ResponseEntity<?> getMonthlyStatistics(
            @RequestParam int month,
            @RequestParam int year) {
        try {
            log.info("Nhận yêu cầu lấy thống kê theo tháng cho provider, tháng: {}, năm: {}", month, year);
            MonthlyStatisticsDTO statistics = vehicleRentService.getMonthlyStatistics(month, year);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thống kê theo tháng: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể lấy thống kê theo tháng: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
