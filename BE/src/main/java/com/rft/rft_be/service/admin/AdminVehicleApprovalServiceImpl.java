package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.AdminUpdateVehicleStatusDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.admin.AdminVehicleApprovalService;
import com.rft.rft_be.service.Notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminVehicleApprovalServiceImpl implements AdminVehicleApprovalService {

    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;
    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;

    @Override
    public Page<VehicleGetDTO> getPendingVehicles(Optional<String> type, Optional<String> sortBy,
                                                  Optional<String> direction, int page, int size) {
        Vehicle.VehicleType vehicleType = type.map(t -> Vehicle.VehicleType.valueOf(t.toUpperCase())).orElse(null);
        Sort sort = Sort.by(direction.orElse("DESC").equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy.orElse("createdAt"));
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Vehicle> pendingPage = vehicleType != null
                ? vehicleRepository.findByVehicleTypeAndStatus(vehicleType, Vehicle.Status.PENDING, pageable)
                : vehicleRepository.findByStatus(Vehicle.Status.PENDING, pageable);

        return pendingPage.map(vehicleMapper::vehicleGet);
    }

    @Override
    public Map<String, Long> getPendingStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("car", vehicleRepository.countByVehicleTypeAndStatus(Vehicle.VehicleType.CAR, Vehicle.Status.PENDING));
        stats.put("motorbike", vehicleRepository.countByVehicleTypeAndStatus(Vehicle.VehicleType.MOTORBIKE, Vehicle.Status.PENDING));
        stats.put("bicycle", vehicleRepository.countByVehicleTypeAndStatus(Vehicle.VehicleType.BICYCLE, Vehicle.Status.PENDING));
        return stats;
    }

    @Override
    public VehicleGetDTO getVehicleDetail(String vehicleId) {
        Vehicle vehicle = vehicleRepository.findByIdWithBrandAndModel(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phương tiện"));

        if (vehicle.getStatus() != Vehicle.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ được xem chi tiết phương tiện ở trạng thái Pending");
        }

        return vehicleMapper.vehicleGet(vehicle);
    }

    @Override
    public void updateVehicleStatus(String vehicleId, AdminUpdateVehicleStatusDTO request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phương tiện"));

        if (request.getStatus() == Vehicle.Status.SUSPENDED ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin không thể trực tiếp thay đổi xe sang trạng thái SUSPENDED");
        }

        if (request.getStatus() == Vehicle.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương tiện đã ở trạng thái pending");
        }

        if (vehicle.getStatus() == request.getStatus()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương tiện đã ở trạng thái " + request.getStatus().name() + " rồi.");
        }

        User owner = vehicle.getUser();
        String vehicleName = vehicle.getThumb();

        if (request.getStatus() == Vehicle.Status.AVAILABLE) {
            vehicle.setStatus(Vehicle.Status.AVAILABLE);
            vehicleRepository.save(vehicle);

            notificationService.createNotification(notificationMapper.toNotificationCreateDTO(
                    owner.getId(), NotificationMapper.VEHICLE_APPROVED,
                    String.format("Xe \"%s\" của bạn đã được duyệt", vehicleName),
                    "/vehicles/manage")
            );

        } else if (request.getStatus() == Vehicle.Status.UNAVAILABLE) {
            if (request.getRejectReason() == null || request.getRejectReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lí do từ chối duyệt là bắt buộc");
            }
            vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
            vehicleRepository.save(vehicle);

            notificationService.createNotification(notificationMapper.toNotificationCreateDTO(
                    owner.getId(), NotificationMapper.VEHICLE_REJECTED,
                    String.format("Xe \"%s\" không được duyệt. Lý do: %s", vehicleName, request.getRejectReason()),
                   "/vehicles/manage")
            );
        }
    }


    @Override
    public void updateMultipleVehicleStatuses(List<AdminUpdateVehicleStatusDTO> requests) {
        for (AdminUpdateVehicleStatusDTO request : requests) {
            updateVehicleStatus(request.getVehicleId(), request);
        }
    }
}
