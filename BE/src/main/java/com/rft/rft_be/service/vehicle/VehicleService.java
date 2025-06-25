package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.entity.Vehicle;
import org.springframework.data.domain.Page;

import java.util.List;

public interface VehicleService {
    List<VehicleDTO> getAllVehicles();
    VehicleDTO getVehicleById(String id);
    //List<CategoryDTO> getAllVehiclesByCategory();
    VehicleDetailDTO getVehicleDetailById(String id);

    Page<VehicleSearchResultDTO> searchVehicles(VehicleSearchDTO req);
    List<VehicleGetDTO> getVehiclesByUserId(String userId);
    List<VehicleGetDTO> getVehiclesByStatus(String status);
    List<VehicleGetDTO> getVehiclesByVehicleType(String vehicleType);
    List<VehicleGetDTO> getVehiclesByBrandId(String brandId);
    List<VehicleGetDTO> getVehiclesByModelId(String modelId);
    VehicleGetDTO getVehicleByLicensePlate(String licensePlate);
    VehicleGetDTO createVehicle(CreateVehicleDTO createVehicleDTO);
    VehicleGetDTO updateVehicle(String id, VehicleGetDTO vehicleGetDTO);
    void deleteVehicle(String id);
    List<VehicleGetDTO> getVehiclesByHaveDriver(String haveDriver);
    List<VehicleGetDTO> getVehiclesByVehicleTypeAndStatus(String vehicleType, String status);
    int getAverageRating(String vehicleId);

}