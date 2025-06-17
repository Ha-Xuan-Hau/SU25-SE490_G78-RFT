package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.CreateVehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;

import java.util.List;

public interface VehicleService {
    List<VehicleDTO> getAllVehicles();
    VehicleDTO getVehicleById(String id);
    List<CategoryDTO> getAllVehiclesByCategory();
    VehicleDetailDTO getVehicleDetailById(String id);


    List<VehicleGetDTO> getVehiclesByUserId(String userId);
    List<VehicleGetDTO> getVehiclesByStatus(String status);
    List<VehicleGetDTO> getVehiclesByVehicleType(String vehicleType);
    List<VehicleGetDTO> getVehiclesByBrandId(String brandId);
    List<VehicleGetDTO> getVehiclesByModelId(String modelId);
    VehicleGetDTO getVehicleByLicensePlate(String licensePlate);
    VehicleGetDTO createVehicle(CreateVehicleDTO createVehicleDTO);
    VehicleGetDTO updateVehicle(String id, VehicleGetDTO vehicleGetDTO_);
    void deleteVehicle(String id);
}