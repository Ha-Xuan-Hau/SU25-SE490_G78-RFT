package com.rft.rft_be.service.vehicleRent;


import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.dto.vehicle.vehicleRent.*;
import com.rft.rft_be.entity.Brand;
import com.rft.rft_be.entity.Model;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.BrandRepository;
import com.rft.rft_be.repository.ModelRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleRentServiceImpl implements VehicleRentService {

    private final VehicleRepository vehicleRepository;
    private final BrandRepository brandRepository;
    private final ModelRepository modelRepository;
    private final UserRepository userRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    public PageResponseDTO<VehicleDTO> getUserVehicles(String userId, int page, int size, String sortBy, String sortDir) {
        log.info("Getting vehicles for user: {}, page: {}, size: {}", userId, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Vehicle> vehiclePage = vehicleRepository.findByUserIdWithBrandAndModel(userId, pageable);

        List<VehicleDTO> vehicleResponses = vehiclePage.getContent()
                .stream()
                .map(vehicleMapper::toDTO)
                .collect(Collectors.toList());

        return PageResponseDTO.<VehicleDTO>builder()
                .content(vehicleResponses)
                .currentPage(vehiclePage.getNumber())
                .totalPages(vehiclePage.getTotalPages())
                .totalElements(vehiclePage.getTotalElements())
                .size(vehiclePage.getSize())
                .hasNext(vehiclePage.hasNext())
                .hasPrevious(vehiclePage.hasPrevious())
                .first(vehiclePage.isFirst())
                .last(vehiclePage.isLast())
                .build();
    }

    @Override
    @Transactional
    public VehicleGetDTO createVehicle(String userId, VehicleRentCreateDTO request) {
        log.info("Creating vehicle for user: {}", userId);

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Validate brand exists
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + request.getBrandId()));

        // Validate model exists and belongs to the brand
        Model model = modelRepository.findById(request.getModelId())
                .orElseThrow(() -> new RuntimeException("Model not found with id: " + request.getModelId()));

        // Check if license plate already exists for this user
        if (vehicleRepository.existsByLicensePlateAndUserId(request.getLicensePlate(), userId)) {
            throw new RuntimeException("License plate already exists for this user");
        }

        Instant now = Instant.now();

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .brand(brand)
                .model(model)
                .licensePlate(request.getLicensePlate())
                .vehicleType(parseVehicleType(request.getVehicleType()))
                .vehicleFeatures(request.getVehicleFeatures())
                .VehicleImages(request.getVehicleImages())
                .insuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()))
                .shipToAddress(parseShipToAddress(request.getShipToAddress()))
                .numberSeat(request.getNumberSeat())
                .yearManufacture(request.getYearManufacture())
                .transmission(parseTransmission(request.getTransmission()))
                .fuelType(parseFuelType(request.getFuelType()))
                .description(request.getDescription())
                .numberVehicle(request.getNumberVehicle())
                .costPerDay(request.getCostPerDay())
                .thumb(request.getThumb())
                .status(Vehicle.Status.AVAILABLE)
                .totalRatings(0)
                .likes(0)
                .build();

        // Manually set timestamps using reflection
        setTimestamps(vehicle, now, now);

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(savedVehicle.getId())
                .orElse(savedVehicle);

        log.info("Vehicle created successfully with id: {}", savedVehicle.getId());
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    @Transactional
    public VehicleGetDTO updateVehicle(String userId, String vehicleId, VehicleRentUpdateDTO request) {
        log.info("Updating vehicle: {} for user: {}", vehicleId, userId);

        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to update it"));

        // Validate brand if provided
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + request.getBrandId()));
            vehicle.setBrand(brand);
        }

        // Validate model if provided
        if (request.getModelId() != null) {
            Model model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new RuntimeException("Model not found with id: " + request.getModelId()));

            // If both brand and model are provided, validate they match
            String brandIdToCheck = request.getBrandId() != null ? request.getBrandId() :
                    (vehicle.getBrand() != null ? vehicle.getBrand().getId() : null);

            vehicle.setModel(model);
        }

        // Check license plate uniqueness if changed
        if (request.getLicensePlate() != null &&
                !request.getLicensePlate().equals(vehicle.getLicensePlate())) {
            if (vehicleRepository.existsByLicensePlateAndUserIdAndIdNot(
                    request.getLicensePlate(), userId, vehicleId)) {
                throw new RuntimeException("License plate already exists for this user");
            }
            vehicle.setLicensePlate(request.getLicensePlate());
        }

        // Update other fields if provided
        if (request.getVehicleType() != null) vehicle.setVehicleType(parseVehicleType(request.getVehicleType()));
        if (request.getVehicleFeatures() != null) vehicle.setVehicleFeatures(request.getVehicleFeatures());
        if (request.getVehicleImages() != null) vehicle.setVehicleImages(request.getVehicleImages());
        if (request.getInsuranceStatus() != null) vehicle.setInsuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()));
        if (request.getShipToAddress() != null) vehicle.setShipToAddress(parseShipToAddress(request.getShipToAddress()));
        if (request.getNumberSeat() != null) vehicle.setNumberSeat(request.getNumberSeat());
        if (request.getYearManufacture() != null) vehicle.setYearManufacture(request.getYearManufacture());
        if (request.getTransmission() != null) vehicle.setTransmission(parseTransmission(request.getTransmission()));
        if (request.getFuelType() != null) vehicle.setFuelType(parseFuelType(request.getFuelType()));
        if (request.getDescription() != null) vehicle.setDescription(request.getDescription());
        if (request.getNumberVehicle() != null) vehicle.setNumberVehicle(request.getNumberVehicle());
        if (request.getCostPerDay() != null) vehicle.setCostPerDay(request.getCostPerDay());
        if (request.getStatus() != null) vehicle.setStatus(parseStatus(request.getStatus()));
        if (request.getThumb() != null) vehicle.setThumb(request.getThumb());

        // Manually set updatedAt timestamp using reflection
        Instant now = Instant.now();
        setUpdatedAt(vehicle, now);

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
                .orElse(updatedVehicle);

        log.info("Vehicle updated successfully: {}", vehicleId);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

//    @Override
//    @Transactional
//    public VehicleGetDTO updateVehicle(String userId, String vehicleId, VehicleRentUpdateDTO request) {
//        log.info("Updating vehicle: {} for user: {}", vehicleId, userId);
//
//        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
//                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to update it"));
//
//        // Validate brand if provided
//        if (request.getBrandId() != null) {
//            Brand brand = brandRepository.findById(request.getBrandId())
//                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + request.getBrandId()));
//            vehicle.setBrand(brand);
//        }
//
//        // Validate model if provided
//        if (request.getModelId() != null) {
//            Model model = modelRepository.findById(request.getModelId())
//                    .orElseThrow(() -> new RuntimeException("Model not found with id: " + request.getModelId()));
//
//            // If both brand and model are provided, validate they match
//            String brandIdToCheck = request.getBrandId() != null ? request.getBrandId() :
//                    (vehicle.getBrand() != null ? vehicle.getBrand().getId() : null);
//            if (brandIdToCheck != null && !model.getBrand().getId().equals(brandIdToCheck)) {
//                throw new RuntimeException("Model does not belong to the specified brand");
//            }
//            vehicle.setModel(model);
//        }
//
//        // Check license plate uniqueness if changed
//        if (request.getLicensePlate() != null &&
//                !request.getLicensePlate().equals(vehicle.getLicensePlate())) {
//            if (vehicleRepository.existsByLicensePlateAndUserIdAndIdNot(
//                    request.getLicensePlate(), userId, vehicleId)) {
//                throw new RuntimeException("License plate already exists for this user");
//            }
//            vehicle.setLicensePlate(request.getLicensePlate());
//        }
//
//        // Update other fields if provided
//        if (request.getVehicleType() != null) vehicle.setVehicleType(Vehicle.VehicleType.valueOf(request.getVehicleType()));
//        if (request.getVehicleFeatures() != null) vehicle.setVehicleFeatures(request.getVehicleFeatures());
//        if (request.getVehicleImages() != null) vehicle.setVehicleImages(request.getVehicleImages());
//        if (request.getInsuranceStatus() != null) vehicle.setInsuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()));
//        if (request.getShipToAddress() != null) vehicle.setShipToAddress(parseShipToAddress(request.getShipToAddress()));
//        if (request.getNumberSeat() != null) vehicle.setNumberSeat(request.getNumberSeat());
//        if (request.getYearManufacture() != null) vehicle.setYearManufacture(request.getYearManufacture());
//        if (request.getTransmission() != null) vehicle.setTransmission(parseTransmission(request.getTransmission()));
//        if (request.getFuelType() != null) vehicle.setFuelType(parseFuelType(request.getFuelType()));
//        if (request.getDescription() != null) vehicle.setDescription(request.getDescription());
//        if (request.getNumberVehicle() != null) vehicle.setNumberVehicle(request.getNumberVehicle());
//        if (request.getCostPerDay() != null) vehicle.setCostPerDay(request.getCostPerDay());
//        if (request.getStatus() != null) vehicle.setStatus(parseStatus(request.getStatus()));
//        if (request.getThumb() != null) vehicle.setThumb(request.getThumb());
//
//        // Manually set updatedAt timestamp using reflection
//        Instant now = Instant.now();
//        setUpdatedAt(vehicle, now);
//
//        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
//
//        // Fetch with brand and model for response
//        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
//                .orElse(updatedVehicle);
//
//        log.info("Vehicle updated successfully: {}", vehicleId);
//        return vehicleMapper.vehicleGet(vehicleWithRelations);
//    }


    @Override
    @Transactional
    public void deleteVehicle(String userId, String vehicleId) {
        log.info("Deleting vehicle: {} for user: {}", vehicleId, userId);

        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to delete it"));

        // Delete the vehicle
        vehicleRepository.delete(vehicle);

        log.info("Vehicle deleted successfully: {}", vehicleId);
    }

    @Override
    public VehicleDetailDTO getVehicleById(String userId, String vehicleId) {
        log.info("Getting vehicle: {} for user: {}", vehicleId, userId);

        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to view it"));

        return vehicleMapper.vehicleToVehicleDetail(vehicle);
    }

    @Override
    public long countUserVehicles(String userId) {
        return vehicleRepository.countByUserId(userId);
    }

    // Helper methods for enum parsing
    private Vehicle.InsuranceStatus parseInsuranceStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return Vehicle.InsuranceStatus.NO;
        }
        try {
            return Vehicle.InsuranceStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid insurance status: {}, defaulting to NO", status);
            return Vehicle.InsuranceStatus.NO;
        }
    }

    private Vehicle.ShipToAddress parseShipToAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return Vehicle.ShipToAddress.NO;
        }
        try {
            return Vehicle.ShipToAddress.valueOf(address.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid ship to address: {}, defaulting to NO", address);
            return Vehicle.ShipToAddress.NO;
        }
    }

    private Vehicle.Transmission parseTransmission(String transmission) {
        if (transmission == null || transmission.trim().isEmpty()) {
            return null;
        }
        try {
            return Vehicle.Transmission.valueOf(transmission.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid transmission: {}, setting to null", transmission);
            return null;
        }
    }

    private Vehicle.FuelType parseFuelType(String fuelType) {
        if (fuelType == null || fuelType.trim().isEmpty()) {
            return null;
        }
        try {
            return Vehicle.FuelType.valueOf(fuelType.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid fuel type: {}, setting to null", fuelType);
            return null;
        }
    }

    private Vehicle.Status parseStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return Vehicle.Status.AVAILABLE;
        }
        try {
            return Vehicle.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status: {}, defaulting to AVAILABLE", status);
            return Vehicle.Status.AVAILABLE;
        }
    }

    // Helper methods for setting timestamps using reflection
    private void setTimestamps(Vehicle vehicle, Instant createdAt, Instant updatedAt) {
        try {
            Field createdAtField = Vehicle.class.getDeclaredField("createdAt");
            createdAtField.setAccessible(true);
            createdAtField.set(vehicle, createdAt);

            Field updatedAtField = Vehicle.class.getDeclaredField("updatedAt");
            updatedAtField.setAccessible(true);
            updatedAtField.set(vehicle, updatedAt);

            log.debug("Set timestamps for vehicle: createdAt={}, updatedAt={}", createdAt, updatedAt);
        } catch (Exception e) {
            log.error("Failed to set timestamps using reflection", e);
            // Fallback: try direct setter methods if they exist
            try {
                vehicle.getClass().getMethod("setCreatedAt", Instant.class).invoke(vehicle, createdAt);
                vehicle.getClass().getMethod("setUpdatedAt", Instant.class).invoke(vehicle, updatedAt);
            } catch (Exception ex) {
                log.error("Failed to set timestamps using setter methods", ex);
            }
        }
    }

    private void setUpdatedAt(Vehicle vehicle, Instant updatedAt) {
        try {
            Field updatedAtField = Vehicle.class.getDeclaredField("updatedAt");
            updatedAtField.setAccessible(true);
            updatedAtField.set(vehicle, updatedAt);

            log.debug("Set updatedAt for vehicle: {}", updatedAt);
        } catch (Exception e) {
            log.error("Failed to set updatedAt using reflection", e);
            // Fallback: try direct setter method if it exists
            try {
                vehicle.getClass().getMethod("setUpdatedAt", Instant.class).invoke(vehicle, updatedAt);
            } catch (Exception ex) {
                log.error("Failed to set updatedAt using setter method", ex);
            }
        }
    }
    private Vehicle.VehicleType parseVehicleType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return null;
        }
        try {
            return Vehicle.VehicleType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid vehicle type: {}, setting to null", type);
            return null;
        }
    }
}
