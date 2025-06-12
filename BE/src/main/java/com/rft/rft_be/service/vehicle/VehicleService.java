package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;

import java.util.List;

public interface VehicleService {
    List<VehicleDTO> getAllVehicles();
    VehicleDTO getVehicleById(String id);
    List<CategoryDTO> getAllVehiclesByCategory();
    VehicleDetailDTO getVehicleDetailById(String id);
}