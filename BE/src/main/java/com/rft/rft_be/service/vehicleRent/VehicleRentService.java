package com.rft.rft_be.service.vehicleRent;

import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleThumbGroupDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.ProviderStatisticsDTO;

import java.util.List;


public interface VehicleRentService {
    PageResponseDTO<VehicleGetDTO> getProviderCar( int page, int size, String sortBy, String sortDir);
    VehicleGetDTO createVehicle( VehicleRentCreateDTO request);
    VehicleGetDTO updateVehicle( String vehicleId, VehicleRentUpdateDTO request);
    //void deleteVehicle( String vehicleId);
    VehicleDetailDTO getVehicleById( String vehicleId);
    long countUserVehicles(String userId);
    VehicleGetDTO toggleVehicleStatus(String vehicleId);
    VehicleGetDTO toggleVehicleSuspended(String vehicleId);
    List<VehicleGetDTO> toggleVehicleSuspendedBulk(List<String> vehicleIds); //chuyển trạng thái nhiều xe


   // List<VehicleThumbGroupDTO> getProviderMotorbikeAndBicycleGroupedByThumb();
    PageResponseDTO<VehicleThumbGroupDTO> getProviderCarGrouped(int page, int size, String sortBy, String sortDir);
    PageResponseDTO<VehicleThumbGroupDTO> getProviderMotorbikeGroupedByThumb(int page, int size, String sortBy, String sortDir);
    PageResponseDTO<VehicleThumbGroupDTO> getProviderBicycleGroupedByThumb(int page, int size, String sortBy, String sortDir);
    List<VehicleGetDTO> createMotorbie_Bicycle(VehicleRentCreateDTO request);
    VehicleGetDTO updateCommonVehicleInfo(String vehicleId, VehicleRentUpdateDTO request);
    VehicleGetDTO updateSpecificVehicleInfo(String vehicleId, VehicleRentUpdateDTO request);

    /**
     * Lấy thống kê tổng quan cho provider hiện tại
     * @return ProviderStatisticsDTO chứa thông tin thống kê
     */
    ProviderStatisticsDTO getProviderStatistics();
}
