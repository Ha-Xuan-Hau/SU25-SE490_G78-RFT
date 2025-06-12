package com.rft.rft_be.service.vehicle;

import ch.qos.logback.core.model.Model;
import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.CreateVehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO_1;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.entity.Brand;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.mapper.VehicleMapper_1;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.rating.RatingService;
import com.rft.rft_be.service.rating.RatingServiceImpl;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VehicleServiceImpl implements VehicleService {



    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final ModelRepository modelRepository;

    VehicleRepository vehicleRepository;
    VehicleMapper vehicleMapper;
    VehicleMapper_1 vehicleMapper_1;
    RatingRepository ratingRepository;
    RatingMapper ratingMapper;
    private final RatingServiceImpl ratingServiceImpl;

    @Override
    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll()
                .stream()
                .map(vehicleMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDTO getVehicleById(String id) {
        return vehicleRepository.findById(id)
                .map(vehicleMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    @Override
    public List<CategoryDTO> getAllVehiclesByCategory() {
        List<Vehicle> vehicles = vehicleRepository.findAll();

        Map<String, List<Vehicle>> grouped = vehicles.stream()
                .collect(Collectors.groupingBy(Vehicle::getVehicleType));

        return grouped.entrySet().stream()
                .map(entry -> CategoryDTO.builder()
                        .categoryName(entry.getKey())
                        .vehicles(entry.getValue().stream()
                                .map(vehicleMapper::toDTO)
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDetailDTO getVehicleDetailById(String id) {
        Optional<Vehicle> vehicle = vehicleRepository.findById(id);
        VehicleDetailDTO vehicleDetailDTO = vehicle.map(vehicleMapper::vehicleToVehicleDetail)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicleDetailDTO.setUserComments(ratingMapper.RatingToUserListCommentDTO(ratingRepository.findAllByVehicle_Id(id)));



        return vehicleDetailDTO;
    }

    @Override
    public List<VehicleDTO_1> getVehiclesByUserId(String userId) {
        List<Vehicle> vehicles = vehicleRepository.findByUserId(userId);
        return vehicles.stream()
                .map(vehicleMapper_1::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleDTO_1> getVehiclesByStatus(String status) {
        try {
            Vehicle.Status vehicleStatus = Vehicle.Status.valueOf(status.toUpperCase());
            List<Vehicle> vehicles = vehicleRepository.findByStatus(vehicleStatus);
            return vehicles.stream()
                    .map(vehicleMapper_1::toDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: AVAILABLE, UNAVAILABLE");
        }
    }

    @Override
    public List<VehicleDTO_1> getVehiclesByVehicleType(String vehicleType) {
        List<Vehicle> vehicles = vehicleRepository.findByVehicleType(vehicleType);
        return vehicles.stream()
                .map(vehicleMapper_1::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleDTO_1> getVehiclesByBrandId(String brandId) {
        List<Vehicle> vehicles = vehicleRepository.findByBrandId(brandId);
        return vehicles.stream()
                .map(vehicleMapper_1::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleDTO_1> getVehiclesByModelId(String modelId) {
        List<Vehicle> vehicles = vehicleRepository.findByModelId(modelId);
        return vehicles.stream()
                .map(vehicleMapper_1::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDTO_1 getVehicleByLicensePlate(String licensePlate) {
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with license plate: " + licensePlate));
        return vehicleMapper_1.toDTO(vehicle);
    }

    @Override
    @Transactional
    public VehicleDTO_1 createVehicle(CreateVehicleDTO createVehicleDTO) {
        // Validate required fields
        if (createVehicleDTO.getLicensePlate() == null || createVehicleDTO.getLicensePlate().trim().isEmpty()) {
            throw new RuntimeException("License plate is required");
        }
        if (createVehicleDTO.getCostPerDay() == null || createVehicleDTO.getCostPerDay().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cost per day must be greater than 0");
        }

        // Check if license plate already exists
        if (vehicleRepository.existsByLicensePlate(createVehicleDTO.getLicensePlate())) {
            throw new RuntimeException("Vehicle with license plate " + createVehicleDTO.getLicensePlate() + " already exists");
        }

        // Validate foreign key references (optional - can be null)
        User user = null;
        if (createVehicleDTO.getUserId() != null) {
            user = userRepository.findById(createVehicleDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + createVehicleDTO.getUserId()));
        }

        Brand brand = null;
        if (createVehicleDTO.getBrandId() != null) {
            brand = brandRepository.findById(createVehicleDTO.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + createVehicleDTO.getBrandId()));
        }

        // Explicitly use the correct Model class from your entity package
        com.rft.rft_be.entity.Model model = null;
        if (createVehicleDTO.getModelId() != null) {
            model = modelRepository.findById(createVehicleDTO.getModelId())
                    .orElseThrow(() -> new RuntimeException("Model not found with id: " + createVehicleDTO.getModelId()));
        }

        // Create new vehicle entity
        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .brand(brand)
                .model(model)
                .licensePlate(createVehicleDTO.getLicensePlate())
                .vehicleType(createVehicleDTO.getVehicleType())
                .vehicleFeatures(createVehicleDTO.getVehicleFeatures())
                .numberSeat(createVehicleDTO.getNumberSeat())
                .yearManufacture(createVehicleDTO.getYearManufacture())
                .description(createVehicleDTO.getDescription())
                .numberVehicle(createVehicleDTO.getNumberVehicle() != null ? createVehicleDTO.getNumberVehicle() : 1)
                .costPerDay(createVehicleDTO.getCostPerDay())
                .thumb(createVehicleDTO.getThumb())
                .totalRatings(0)
                .likes(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Set enum values with validation
        if (createVehicleDTO.getInsuranceStatus() != null) {
            try {
                vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.valueOf(createVehicleDTO.getInsuranceStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid insurance status: " + createVehicleDTO.getInsuranceStatus());
            }
        } else {
            vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.NO);
        }

        if (createVehicleDTO.getShipToAddress() != null) {
            try {
                vehicle.setShipToAddress(Vehicle.ShipToAddress.valueOf(createVehicleDTO.getShipToAddress().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid ship to address: " + createVehicleDTO.getShipToAddress());
            }
        } else {
            vehicle.setShipToAddress(Vehicle.ShipToAddress.NO);
        }

        if (createVehicleDTO.getTransmission() != null) {
            try {
                vehicle.setTransmission(Vehicle.Transmission.valueOf(createVehicleDTO.getTransmission().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid transmission: " + createVehicleDTO.getTransmission());
            }
        }

        if (createVehicleDTO.getFuelType() != null) {
            try {
                vehicle.setFuelType(Vehicle.FuelType.valueOf(createVehicleDTO.getFuelType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid fuel type: " + createVehicleDTO.getFuelType());
            }
        }

        if (createVehicleDTO.getStatus() != null) {
            try {
                vehicle.setStatus(Vehicle.Status.valueOf(createVehicleDTO.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + createVehicleDTO.getStatus());
            }
        } else {
            vehicle.setStatus(Vehicle.Status.AVAILABLE);
        }

        // Save vehicle
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return vehicleMapper_1.toDTO(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleDTO_1 updateVehicle(String id, VehicleDTO_1 vehicleDTO_1) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        // Update fields (only update non-null values from DTO)
        if (vehicleDTO_1.getLicensePlate() != null) {
            existingVehicle.setLicensePlate(vehicleDTO_1.getLicensePlate());
        }
        if (vehicleDTO_1.getVehicleType() != null) {
            existingVehicle.setVehicleType(vehicleDTO_1.getVehicleType());
        }
        if (vehicleDTO_1.getVehicleFeatures() != null) {
            existingVehicle.setVehicleFeatures(vehicleDTO_1.getVehicleFeatures());
        }
        if (vehicleDTO_1.getDescription() != null) {
            existingVehicle.setDescription(vehicleDTO_1.getDescription());
        }
        if (vehicleDTO_1.getCostPerDay() != null) {
            existingVehicle.setCostPerDay(vehicleDTO_1.getCostPerDay());
        }
        if (vehicleDTO_1.getStatus() != null) {
            try {
                existingVehicle.setStatus(Vehicle.Status.valueOf(vehicleDTO_1.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status value: " + vehicleDTO_1.getStatus());
            }
        }
        if (vehicleDTO_1.getThumb() != null) {
            existingVehicle.setThumb(vehicleDTO_1.getThumb());
        }
        if (vehicleDTO_1.getNumberSeat() != null) {
            existingVehicle.setNumberSeat(vehicleDTO_1.getNumberSeat());
        }
        if (vehicleDTO_1.getYearManufacture() != null) {
            existingVehicle.setYearManufacture(vehicleDTO_1.getYearManufacture());
        }
        if (vehicleDTO_1.getTransmission() != null) {
            try {
                existingVehicle.setTransmission(Vehicle.Transmission.valueOf(vehicleDTO_1.getTransmission().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid transmission value: " + vehicleDTO_1.getTransmission());
            }
        }
        if (vehicleDTO_1.getFuelType() != null) {
            try {
                existingVehicle.setFuelType(Vehicle.FuelType.valueOf(vehicleDTO_1.getFuelType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid fuel type value: " + vehicleDTO_1.getFuelType());
            }
        }

        // Update timestamp
        existingVehicle.setUpdatedAt(Instant.now());

        // Save and return updated vehicle
        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return vehicleMapper_1.toDTO(updatedVehicle);
    }

    @Override
    @Transactional
    public void deleteVehicle(String id) {
        boolean exists = vehicleRepository.existsById(id);
        if (!exists) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }
        vehicleRepository.deleteById(id);
    }


}