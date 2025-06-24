package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.CreateVehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.entity.Brand;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.rating.RatingServiceImpl;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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


    private final BookedTimeSlotRepository bookedTimeSlotsRepository;
    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final ModelRepository modelRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    VehicleRepository vehicleRepository;
    VehicleMapper vehicleMapper;

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

//    @Override
//    public List<CategoryDTO> getAllVehiclesByCategory() {
//        List<Vehicle> vehicles = vehicleRepository.findAll();
//
//        Map<String, List<Vehicle>> grouped = vehicles.stream()
//                .collect(Collectors.groupingBy(Vehicle::getVehicleType));
//
//        return grouped.entrySet().stream()
//                .map(entry -> CategoryDTO.builder()
//                        .categoryName(entry.getKey())
//                        .vehicles(entry.getValue().stream()
//                                .map(vehicleMapper::toDTO)
//                                .collect(Collectors.toList()))
//                        .build())
//                .collect(Collectors.toList());
//    }

    @Override
    public VehicleDetailDTO getVehicleDetailById(String id) {
        Optional<Vehicle> vehicle = vehicleRepository.findById(id);
        VehicleDetailDTO vehicleDetailDTO = vehicle.map(vehicleMapper::vehicleToVehicleDetail)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicleDetailDTO.setUserComments(ratingMapper.RatingToUserListCommentDTO(ratingRepository.findAllByVehicle_Id(id)));



        return vehicleDetailDTO;
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByUserId(String userId) {
        List<Vehicle> vehicles = vehicleRepository.findByUserId(userId);
        return vehicles.stream()
                .map(vehicleMapper::vehicleGet)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByStatus(String status) {
        try {
            Vehicle.Status vehicleStatus = Vehicle.Status.valueOf(status.toUpperCase());
            List<Vehicle> vehicles = vehicleRepository.findByStatus(vehicleStatus);
            return vehicles.stream()
                    .map(vehicleMapper::vehicleGet)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: AVAILABLE, UNAVAILABLE");
        }
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByVehicleType(String vehicleType) {
        List<Vehicle> vehicles = vehicleRepository.findByVehicleType(vehicleType);
        return vehicles.stream()
                .map(vehicleMapper::vehicleGet)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByBrandId(String brandId) {
        List<Vehicle> vehicles = vehicleRepository.findByBrandId(brandId);
        return vehicles.stream()
                .map(vehicleMapper::vehicleGet)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByModelId(String modelId) {
        List<Vehicle> vehicles = vehicleRepository.findByModelId(modelId);
        return vehicles.stream()
                .map(vehicleMapper::vehicleGet)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleGetDTO getVehicleByLicensePlate(String licensePlate) {
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with license plate: " + licensePlate));
        return vehicleMapper.vehicleGet(vehicle);
    }

    @Override
    @Transactional
    public VehicleGetDTO createVehicle(CreateVehicleDTO createVehicleDTO) {
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
        return vehicleMapper.vehicleGet(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleGetDTO updateVehicle(String id, VehicleGetDTO vehicleGetDTO_) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        // Update fields (only update non-null values from DTO)
        if (vehicleGetDTO_.getLicensePlate() != null) {
            existingVehicle.setLicensePlate(vehicleGetDTO_.getLicensePlate());
        }
        if (vehicleGetDTO_.getVehicleType() != null) {
            existingVehicle.setVehicleType(vehicleGetDTO_.getVehicleType());
        }
        if (vehicleGetDTO_.getVehicleFeatures() != null) {
            existingVehicle.setVehicleFeatures(vehicleGetDTO_.getVehicleFeatures());
        }
        if (vehicleGetDTO_.getDescription() != null) {
            existingVehicle.setDescription(vehicleGetDTO_.getDescription());
        }
        if (vehicleGetDTO_.getCostPerDay() != null) {
            existingVehicle.setCostPerDay(vehicleGetDTO_.getCostPerDay());
        }
        if (vehicleGetDTO_.getStatus() != null) {
            try {
                existingVehicle.setStatus(Vehicle.Status.valueOf(vehicleGetDTO_.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status value: " + vehicleGetDTO_.getStatus());
            }
        }
        if (vehicleGetDTO_.getThumb() != null) {
            existingVehicle.setThumb(vehicleGetDTO_.getThumb());
        }
        if (vehicleGetDTO_.getNumberSeat() != null) {
            existingVehicle.setNumberSeat(vehicleGetDTO_.getNumberSeat());
        }
        if (vehicleGetDTO_.getYearManufacture() != null) {
            existingVehicle.setYearManufacture(vehicleGetDTO_.getYearManufacture());
        }
        if (vehicleGetDTO_.getTransmission() != null) {
            try {
                existingVehicle.setTransmission(Vehicle.Transmission.valueOf(vehicleGetDTO_.getTransmission().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid transmission value: " + vehicleGetDTO_.getTransmission());
            }
        }
        if (vehicleGetDTO_.getFuelType() != null) {
            try {
                existingVehicle.setFuelType(Vehicle.FuelType.valueOf(vehicleGetDTO_.getFuelType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid fuel type value: " + vehicleGetDTO_.getFuelType());
            }
        }

        // Update timestamp
        existingVehicle.setUpdatedAt(Instant.now());

        // Save and return updated vehicle
        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return vehicleMapper.vehicleGet(updatedVehicle);
    }

    @Override
    @Transactional
    public void deleteVehicle(String id) {
        if (!vehicleRepository.existsById(id)) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }

        try {
            // Delete in correct order using native SQL to avoid JPA relationship issues

            // 1. Delete final_contracts (deepest dependency)
            jdbcTemplate.update(
                    "DELETE fc FROM final_contracts fc " +
                            "INNER JOIN contracts c ON fc.contract_id = c.id " +
                            "INNER JOIN bookings b ON c.booking_id = b.id " +
                            "WHERE b.vehicle_id = ?", id);

            // 2. Delete contracts
            jdbcTemplate.update(
                    "DELETE c FROM contracts c " +
                            "INNER JOIN bookings b ON c.booking_id = b.id " +
                            "WHERE b.vehicle_id = ?", id);

            // 3. Delete ratings
            jdbcTemplate.update("DELETE FROM ratings WHERE vehicle_id = ?", id);

            // 4. Delete bookings
            jdbcTemplate.update("DELETE FROM bookings WHERE vehicle_id = ?", id);

            // 5. Delete booked_time_slots
            jdbcTemplate.update("DELETE FROM booked_time_slots WHERE vehicle_id = ?", id);

            // 6. Final delete the vehicle
            vehicleRepository.deleteById(id);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete vehicle: " + e.getMessage());
        }
    }


}