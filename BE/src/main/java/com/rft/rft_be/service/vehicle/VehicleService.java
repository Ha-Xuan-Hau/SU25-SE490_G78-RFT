package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.vehicle.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface VehicleService {
    List<VehicleGetDTO> getAllVehicles();
    VehicleGetDTO getVehicleById(String id);
    //List<CategoryDTO> getAllVehiclesByCategory();
    VehicleDetailDTO getVehicleDetailById(String id);


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
    List<VehicleGetDTO> getVehiclesByPenaltyId(String penaltyId);
    double getAverageRating(String vehicleId);
    List<VehicleDTO> getAllAvailableVehicles();
    Page<VehicleSearchResultDTO> searchVehicles(VehicleSearchDTO req, Instant timeFrom, Instant timeTo);
    void deleteExpiredBookedTimeSlots();
    Page<VehicleSearchResultDTO> basicSearch(String address, String type, Instant from, Instant to, Pageable pageable);
}