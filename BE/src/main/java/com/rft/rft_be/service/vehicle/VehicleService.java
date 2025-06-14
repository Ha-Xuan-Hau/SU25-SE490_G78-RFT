package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.CreateVehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO_1;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;

import java.util.List;

public interface VehicleService {
    List<VehicleDTO> getAllVehicles();
    VehicleDTO getVehicleById(String id);
    List<CategoryDTO> getAllVehiclesByCategory();
    VehicleDetailDTO getVehicleDetailById(String id);


    List<VehicleDTO_1> getVehiclesByUserId(String userId);
    List<VehicleDTO_1> getVehiclesByStatus(String status);
    List<VehicleDTO_1> getVehiclesByVehicleType(String vehicleType);
    List<VehicleDTO_1> getVehiclesByBrandId(String brandId);
    List<VehicleDTO_1> getVehiclesByModelId(String modelId);
    VehicleDTO_1 getVehicleByLicensePlate(String licensePlate);
    VehicleDTO_1 createVehicle(CreateVehicleDTO createVehicleDTO);
    VehicleDTO_1 updateVehicle(String id, VehicleDTO_1 vehicleDTO_1);
    void deleteVehicle(String id);
}