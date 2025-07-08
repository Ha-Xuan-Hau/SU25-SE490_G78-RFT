package com.rft.rft_be.service.vehicleRent;

import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;


public interface VehicleRentService {
    PageResponseDTO<VehicleDTO> getUserVehicles( int page, int size, String sortBy, String sortDir);
    VehicleGetDTO createVehicle( VehicleRentCreateDTO request);
    VehicleGetDTO updateVehicle( String vehicleId, VehicleRentUpdateDTO request);
    void deleteVehicle( String vehicleId);
    VehicleDetailDTO getVehicleById(String userId, String vehicleId);
    long countUserVehicles(String userId);

}
