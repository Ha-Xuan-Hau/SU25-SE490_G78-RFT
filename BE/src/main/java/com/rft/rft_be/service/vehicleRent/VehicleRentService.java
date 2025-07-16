package com.rft.rft_be.service.vehicleRent;

import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleThumbGroupDTO;

import java.util.List;


public interface VehicleRentService {
    PageResponseDTO<VehicleDTO> getUserVehicles( int page, int size, String sortBy, String sortDir);
    VehicleGetDTO createVehicle( VehicleRentCreateDTO request);
    VehicleGetDTO updateVehicle( String vehicleId, VehicleRentUpdateDTO request);
    //void deleteVehicle( String vehicleId);
    VehicleDetailDTO getVehicleById( String vehicleId);
    long countUserVehicles(String userId);
    VehicleGetDTO toggleVehicleStatus(String vehicleId);
    List<VehicleThumbGroupDTO> getProviderMotorbikeAndBicycleGroupedByThumb();
    List<VehicleThumbGroupDTO> getProviderMotorbikeGroupedByThumb();
    List<VehicleThumbGroupDTO> getProviderBicycleGroupedByThumb();
    VehicleGetDTO createOrUpdateVehicleWithNumberVehicle(VehicleRentCreateDTO request);
    VehicleGetDTO updateCommonVehicleInfo(String vehicleId, VehicleRentUpdateDTO request);
    VehicleGetDTO updateSpecificVehicleInfo(String vehicleId, VehicleRentUpdateDTO request);
}
