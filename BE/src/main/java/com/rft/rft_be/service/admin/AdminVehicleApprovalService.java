package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.admin.AdminUpdateVehicleStatusDTO;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface AdminVehicleApprovalService {

    Page<VehicleGetDTO> getPendingVehicles(
            Optional<String> type,
            Optional<String> sortBy,
            Optional<String> direction,
            int page,
            int size
    );

    Map<String, Long> getPendingStats();

    VehicleGetDTO getVehicleDetail(String vehicleId);

    void updateVehicleStatus(String vehicleId, AdminUpdateVehicleStatusDTO request);

    void updateMultipleVehicleStatuses(List<AdminUpdateVehicleStatusDTO> requests);
}
