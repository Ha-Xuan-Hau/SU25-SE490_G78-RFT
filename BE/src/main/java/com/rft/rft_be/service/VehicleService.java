package com.rft.rft_be.service;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.CreateVehicleDTO;
import com.rft.rft_be.dto.VehicleDTO;

import java.util.List;

public interface VehicleService {
    List<VehicleDTO> getAllVehicles();
    VehicleDTO getVehicleById(String id);
    List<CategoryDTO> getAllVehiclesByCategory();
    void deleteVehicleById(String id);
    VehicleDTO updateVehicle(String id, VehicleDTO vehicleDTO);
    VehicleDTO createVehicle(CreateVehicleDTO createVehicleDTO);}