package com.rft.rft_be.service.vehicle;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.ExtraFeeRuleMapper;
import com.rft.rft_be.repository.*;
import jakarta.persistence.criteria.Expression;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.service.rating.RatingServiceImpl;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VehicleServiceImpl implements VehicleService {

    BookedTimeSlotRepository bookedTimeSlotsRepository;
    UserRepository userRepository;
    BrandRepository brandRepository;
    ModelRepository modelRepository;
    PenaltyRepository penaltyRepository;
    ExtraFeeRuleRepository extraFeeRuleRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    VehicleRepository vehicleRepository;
    VehicleMapper vehicleMapper;
    RatingRepository ratingRepository;
    RatingMapper ratingMapper;
    ExtraFeeRuleMapper extraFeeRuleMapper;

    @Override
    public List<VehicleCardDetailDTO> getAllVehicles() {
        return vehicleRepository.findAllWithPenalty()
                .stream()
                .map(vehicle -> {
                    VehicleCardDetailDTO dto = vehicleMapper.vehicleToVehicleCard(vehicle);
                    dto.setRating(getAverageRating(vehicle.getId()));

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public VehicleGetDTO getVehicleById(String id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        VehicleGetDTO dto = vehicleMapper.vehicleGet(vehicle);
        dto.setExtraFeeRule(extraFeeRuleMapper.toDto(extraFeeRuleRepository.findByVehicleId(id)));
        dto.setRating(getAverageRating(id));

        return dto;
    }

    @Override
    public VehicleDetailDTO getVehicleDetailById(String id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        VehicleDetailDTO vehicleDetailDTO = vehicleMapper.vehicleToVehicleDetail(vehicle);
        vehicleDetailDTO.setUserComments(ratingMapper.RatingToUserListCommentDTO(ratingRepository.findAllByVehicleId(id)));
        vehicleDetailDTO.setRating(ratingRepository.findAverageByVehicleId(id));
        vehicleDetailDTO.setExtraFeeRule(extraFeeRuleMapper.toDto(extraFeeRuleRepository.findByVehicleId(id)));
        return vehicleDetailDTO;
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByUserId(String userId) {
        List<Vehicle> vehicles = vehicleRepository.findAvailableVehiclesByUserId(userId);
        return vehicles.stream()
                .map(vehicleMapper::vehicleGet)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleDTO> getAllAvailableVehicles() {
        return vehicleRepository.findByStatus(Vehicle.Status.AVAILABLE)
                .stream()
                .map(vehicleMapper::toDTO)
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
        try {
            Vehicle.VehicleType type = Vehicle.VehicleType.valueOf(vehicleType.toUpperCase());
            List<Vehicle> vehicles = vehicleRepository.findByVehicleType(type);
            return vehicles.stream()
                    .map(vehicleMapper::vehicleGet)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid vehicle type: " + vehicleType + ". Valid values are: CAR, MOTORBIKE, BICYCLE");
        }
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByHaveDriver(String haveDriver) {
        try {
            Vehicle.HaveDriver driver = Vehicle.HaveDriver.valueOf(haveDriver.toUpperCase());
            List<Vehicle> vehicles = vehicleRepository.findByHaveDriver(driver);
            return vehicles.stream()
                    .map(vehicleMapper::vehicleGet)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid have driver: " + haveDriver + ". Valid values are: YES, NO");
        }
    }

    @Override
    public List<VehicleGetDTO> getVehiclesByVehicleTypeAndStatus(String vehicleType, String status) {
        try {
            Vehicle.VehicleType type = Vehicle.VehicleType.valueOf(vehicleType.toUpperCase());
            Vehicle.Status vehicleStatus = Vehicle.Status.valueOf(status.toUpperCase());
            List<Vehicle> vehicles = vehicleRepository.findByVehicleTypeAndStatus(type, vehicleStatus);
            return vehicles.stream()
                    .map(vehicleMapper::vehicleGet)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid vehicle type or status. Valid types: CAR, MOTORBIKE, BICYCLE. Valid statuses: AVAILABLE, UNAVAILABLE");
        }
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
    public List<VehicleGetDTO> getVehiclesByPenaltyId(String penaltyId) {
        List<Vehicle> vehicles = vehicleRepository.findByPenaltyId(penaltyId);
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


//    @Override
//    @Transactional
//    public VehicleGetDTO createVehicle(CreateVehicleDTO createVehicleDTO) {
//        if (createVehicleDTO.getLicensePlate() == null || createVehicleDTO.getLicensePlate().trim().isEmpty()) {
//            throw new RuntimeException("License plate is required");
//        }
//        if (createVehicleDTO.getCostPerDay() == null || createVehicleDTO.getCostPerDay().compareTo(java.math.BigDecimal.ZERO) <= 0) {
//            throw new RuntimeException("Cost per day must be greater than 0");
//        }
//
//        // Check if license plate already exists
//        boolean exists = vehicleRepository.existsByLicensePlate(createVehicleDTO.getLicensePlate());
//        if (exists) {
//            throw new RuntimeException("Vehicle with license plate " + createVehicleDTO.getLicensePlate() + " already exists");
//        }
//
//        // Validate foreign key references (optional - can be null)
//        User user = null;
//        if (createVehicleDTO.getUserId() != null && !createVehicleDTO.getUserId().trim().isEmpty()) {
//            user = userRepository.findById(createVehicleDTO.getUserId())
//                    .orElseThrow(() -> new RuntimeException("User not found with id: " + createVehicleDTO.getUserId()));
//        }
//
//        Brand brand = null;
//        if (createVehicleDTO.getBrandId() != null && !createVehicleDTO.getBrandId().trim().isEmpty()) {
//            brand = brandRepository.findById(createVehicleDTO.getBrandId())
//                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + createVehicleDTO.getBrandId()));
//        }
//
//        Model model = null;
//        if (createVehicleDTO.getModelId() != null && !createVehicleDTO.getModelId().trim().isEmpty()) {
//            model = modelRepository.findById(createVehicleDTO.getModelId())
//                    .orElseThrow(() -> new RuntimeException("Model not found with id: " + createVehicleDTO.getModelId()));
//        }
//
//        Penalty penalty = null;
//        if (createVehicleDTO.getPenaltyId() != null && !createVehicleDTO.getPenaltyId().trim().isEmpty()) {
//            penalty = penaltyRepository.findById(createVehicleDTO.getPenaltyId())
//                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + createVehicleDTO.getPenaltyId()));
//        }
//
//
//
//        // Create new vehicle entity
//        Vehicle vehicle = Vehicle.builder()
//                .user(user)
//                .brand(brand)
//                .model(model)
//                .penalty(penalty)
//                .licensePlate(createVehicleDTO.getLicensePlate())
//                .vehicleFeatures(createVehicleDTO.getVehicleFeatures())
////                .vehicleImages(createVehicleDTO.getVehicleImages()) // Note: VehicleImages with capital V
//                .numberSeat(createVehicleDTO.getNumberSeat())
//                .yearManufacture(createVehicleDTO.getYearManufacture())
//                .description(createVehicleDTO.getDescription())
//                .numberVehicle(createVehicleDTO.getNumberVehicle() != null ? createVehicleDTO.getNumberVehicle() : 1)
//                .costPerDay(createVehicleDTO.getCostPerDay())
//                .thumb(createVehicleDTO.getThumb())
//                .totalRatings(0)
//                .likes(0)
//                .createdAt(LocalDateTime.now())
//                .updatedAt(LocalDateTime.now())
//                .build();
//
//
//        if (createVehicleDTO.getVehicleImages() != null) {
//            ObjectMapper mapper = new ObjectMapper();
//            try {
//                String imagesJson = mapper.writeValueAsString(
//                        createVehicleDTO.getVehicleImages()
//                                .stream()
//                                .map(VehicleImageDTO::getImageUrl)
//                                .collect(Collectors.toList())
//                );
//                vehicle.setVehicleImages(imagesJson);
//            } catch (Exception e) {
//                vehicle.setVehicleImages("[]");
//            }
//        } else {
//            vehicle.setVehicleImages("[]");
//        }
//
//        // Set enum values with validation
//        if (createVehicleDTO.getVehicleType() != null && !createVehicleDTO.getVehicleType().trim().isEmpty()) {
//            try {
//                vehicle.setVehicleType(Vehicle.VehicleType.valueOf(createVehicleDTO.getVehicleType().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid vehicle type: " + createVehicleDTO.getVehicleType() + ". Valid values are: CAR, MOTORBIKE, BICYCLE");
//            }
//        }
//
//        if (createVehicleDTO.getHaveDriver() != null && !createVehicleDTO.getHaveDriver().trim().isEmpty()) {
//            try {
//                vehicle.setHaveDriver(Vehicle.HaveDriver.valueOf(createVehicleDTO.getHaveDriver().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid have driver: " + createVehicleDTO.getHaveDriver() + ". Valid values are: YES, NO");
//            }
//        } else {
//            vehicle.setHaveDriver(Vehicle.HaveDriver.NO);
//        }
//
//        if (createVehicleDTO.getInsuranceStatus() != null && !createVehicleDTO.getInsuranceStatus().trim().isEmpty()) {
//            try {
//                vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.valueOf(createVehicleDTO.getInsuranceStatus().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid insurance status: " + createVehicleDTO.getInsuranceStatus() + ". Valid values are: YES, NO");
//            }
//        } else {
//            vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.NO);
//        }
//
//        if (createVehicleDTO.getShipToAddress() != null && !createVehicleDTO.getShipToAddress().trim().isEmpty()) {
//            try {
//                vehicle.setShipToAddress(Vehicle.ShipToAddress.valueOf(createVehicleDTO.getShipToAddress().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid ship to address: " + createVehicleDTO.getShipToAddress() + ". Valid values are: YES, NO");
//            }
//        } else {
//            vehicle.setShipToAddress(Vehicle.ShipToAddress.NO);
//        }
//
//        if (createVehicleDTO.getTransmission() != null && !createVehicleDTO.getTransmission().trim().isEmpty()) {
//            try {
//                vehicle.setTransmission(Vehicle.Transmission.valueOf(createVehicleDTO.getTransmission().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid transmission: " + createVehicleDTO.getTransmission() + ". Valid values are: MANUAL, AUTOMATIC");
//            }
//        }
//
//        if (createVehicleDTO.getFuelType() != null && !createVehicleDTO.getFuelType().trim().isEmpty()) {
//            try {
//                vehicle.setFuelType(Vehicle.FuelType.valueOf(createVehicleDTO.getFuelType().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid fuel type: " + createVehicleDTO.getFuelType() + ". Valid values are: GASOLINE, ELECTRIC");
//            }
//        }
//
//        if (createVehicleDTO.getStatus() != null && !createVehicleDTO.getStatus().trim().isEmpty()) {
//            try {
//                vehicle.setStatus(Vehicle.Status.valueOf(createVehicleDTO.getStatus().toUpperCase()));
//            } catch (IllegalArgumentException e) {
//                throw new RuntimeException("Invalid status: " + createVehicleDTO.getStatus() + ". Valid values are: AVAILABLE, UNAVAILABLE");
//            }
//        } else {
//            vehicle.setStatus(Vehicle.Status.AVAILABLE);
//        }
//
//        // Save vehicle
//        Vehicle savedVehicle = vehicleRepository.save(vehicle);
//        return vehicleMapper.vehicleGet(savedVehicle);
//    }


    @Override
    public double getAverageRating(String vehicleId) {
        Double avg = ratingRepository.findAverageByVehicleId(vehicleId);
        return avg == null ? 0 : (double) avg;
    }

    @Override
    @Transactional
    public VehicleGetDTO updateVehicle(String id, VehicleGetDTO vehicleDTO) {

        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        // Update fields (only update non-null values from DTO)
        if (vehicleDTO.getLicensePlate() != null && !vehicleDTO.getLicensePlate().trim().isEmpty()) {
            // Check if new license plate already exists (excluding current record)
            if (existingVehicle.getLicensePlate() != null &&
                    !existingVehicle.getLicensePlate().equals(vehicleDTO.getLicensePlate())) {
                boolean exists = vehicleRepository.existsByLicensePlate(vehicleDTO.getLicensePlate());
                if (exists) {
                    throw new RuntimeException("Vehicle with license plate " + vehicleDTO.getLicensePlate() + " already exists");
                }
            }
            else if (existingVehicle.getLicensePlate() == null &&
                    vehicleDTO.getLicensePlate() != null) {
                // Nếu DB là null mà DTO có biển số, cũng cần kiểm tra trùng
                boolean exists = vehicleRepository.existsByLicensePlate(vehicleDTO.getLicensePlate());
                if (exists) {
                    throw new RuntimeException("Vehicle with license plate " + vehicleDTO.getLicensePlate() + " already exists");
                }
            }
            existingVehicle.setLicensePlate(vehicleDTO.getLicensePlate());
        }

        // Update penalty if provided
        if (vehicleDTO.getPenaltyId() != null && !vehicleDTO.getPenaltyId().trim().isEmpty()) {
            Penalty penalty = penaltyRepository.findById(vehicleDTO.getPenaltyId())
                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + vehicleDTO.getPenaltyId()));
            existingVehicle.setPenalty(penalty);
        }

        if (vehicleDTO.getVehicleFeatures() != null) {
            existingVehicle.setVehicleFeatures(vehicleDTO.getVehicleFeatures());
        }

//        if (vehicleDTO.getVehicleImages() != null) {
//            existingVehicle.setVehicleImages(vehicleDTO.getVehicleImages());
//        }

        if (vehicleDTO.getVehicleImages() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                String imagesJson = mapper.writeValueAsString(vehicleDTO.getVehicleImages()
                        .stream()
                        .map(VehicleImageDTO::getImageUrl)
                        .collect(Collectors.toList())
                );
                existingVehicle.setVehicleImages(imagesJson);
            } catch (Exception e) {
                // handle error
            }
        }

        if (vehicleDTO.getNumberSeat() != null) {
            existingVehicle.setNumberSeat(vehicleDTO.getNumberSeat());
        }

        if (vehicleDTO.getYearManufacture() != null) {
            existingVehicle.setYearManufacture(vehicleDTO.getYearManufacture());
        }

        if (vehicleDTO.getDescription() != null) {
            existingVehicle.setDescription(vehicleDTO.getDescription());
        }

        if (vehicleDTO.getNumberVehicle() != null) {
            existingVehicle.setNumberVehicle(vehicleDTO.getNumberVehicle());
        }

        if (vehicleDTO.getCostPerDay() != null) {
            existingVehicle.setCostPerDay(vehicleDTO.getCostPerDay());
        }

        if (vehicleDTO.getThumb() != null) {
            existingVehicle.setThumb(vehicleDTO.getThumb());
        }

        // Update enum fields
        if (vehicleDTO.getVehicleType() != null && !vehicleDTO.getVehicleType().trim().isEmpty()) {
            try {
                existingVehicle.setVehicleType(Vehicle.VehicleType.valueOf(vehicleDTO.getVehicleType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid vehicle type: " + vehicleDTO.getVehicleType() + ". Valid values are: CAR, MOTORBIKE, BICYCLE");
            }
        }

        if (vehicleDTO.getHaveDriver() != null && !vehicleDTO.getHaveDriver().trim().isEmpty()) {
            try {
                existingVehicle.setHaveDriver(Vehicle.HaveDriver.valueOf(vehicleDTO.getHaveDriver().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid have driver: " + vehicleDTO.getHaveDriver() + ". Valid values are: YES, NO");
            }
        }

        if (vehicleDTO.getInsuranceStatus() != null && !vehicleDTO.getInsuranceStatus().trim().isEmpty()) {
            try {
                existingVehicle.setInsuranceStatus(Vehicle.InsuranceStatus.valueOf(vehicleDTO.getInsuranceStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid insurance status: " + vehicleDTO.getInsuranceStatus() + ". Valid values are: YES, NO");
            }
        }

        if (vehicleDTO.getShipToAddress() != null && !vehicleDTO.getShipToAddress().trim().isEmpty()) {
            try {
                existingVehicle.setShipToAddress(Vehicle.ShipToAddress.valueOf(vehicleDTO.getShipToAddress().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid ship to address: " + vehicleDTO.getShipToAddress() + ". Valid values are: YES, NO");
            }
        }

        if (vehicleDTO.getTransmission() != null && !vehicleDTO.getTransmission().trim().isEmpty()) {
            try {
                existingVehicle.setTransmission(Vehicle.Transmission.valueOf(vehicleDTO.getTransmission().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid transmission: " + vehicleDTO.getTransmission() + ". Valid values are: MANUAL, AUTOMATIC");
            }
        }

        if (vehicleDTO.getFuelType() != null && !vehicleDTO.getFuelType().trim().isEmpty()) {
            try {
                existingVehicle.setFuelType(Vehicle.FuelType.valueOf(vehicleDTO.getFuelType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid fuel type: " + vehicleDTO.getFuelType() + ". Valid values are: GASOLINE, ELECTRIC");
            }
        }

        if (vehicleDTO.getStatus() != null && !vehicleDTO.getStatus().trim().isEmpty()) {
            try {
                existingVehicle.setStatus(Vehicle.Status.valueOf(vehicleDTO.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + vehicleDTO.getStatus() + ". Valid values are: AVAILABLE, UNAVAILABLE");
            }
        }

        // Save and return updated vehicle
        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return vehicleMapper.vehicleGet(updatedVehicle);
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

    @Override
    public Page<VehicleSearchResultDTO> searchVehicles(VehicleSearchDTO req, LocalDateTime timeFrom, LocalDateTime timeTo) {
        Pageable pageable = PageRequest.of(req.getPage(), req.getSize());

        Specification<Vehicle> spec = (root, query, cb) -> cb.conjunction();

        // Thêm điều kiện status AVAILABLE nếu không được chỉ định
        spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), Vehicle.Status.AVAILABLE));

        if (req.getVehicleTypes() != null && !req.getVehicleTypes().isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("vehicleType").in(req.getVehicleTypes()));
        }

        if (req.getAddresses() != null && !req.getAddresses().isEmpty()) {
            spec = spec.and((root, query, cb) -> {
                Join<Vehicle, User> userJoin = root.join("user", JoinType.INNER);
                Predicate combinedPredicate = cb.disjunction();
                for (String addr : req.getAddresses()) {
                    combinedPredicate = cb.or(combinedPredicate,
                            cb.like(cb.lower(userJoin.get("address")), "%" + addr.toLowerCase() + "%"));
                }
                return combinedPredicate;
            });
        }

        if (req.getFeatures() != null && !req.getFeatures().isEmpty()) {
            spec = spec.and((root, query, cb) -> {
                // CAST CLOB -> String trước khi lower()
                Expression<String> vf = root.get("vehicleFeatures").as(String.class);
                Expression<String> lowered = cb.lower(vf);
                Expression<String> noSpaces = cb.function("REPLACE", String.class, lowered, cb.literal(" "), cb.literal(""));
                // concat "," + noSpaces + ","
                Expression<String> wrapped = cb.concat(cb.concat(cb.literal(","), noSpaces), cb.literal(","));

                Predicate p = cb.conjunction(); // AND all features. Nếu muốn match-any -> cb.disjunction()
                for (String raw : req.getFeatures()) {
                    String needle = (raw == null ? "" : raw.toLowerCase().replaceAll("\\s+", "")); // "Leather Seats" -> "leatherseats"
                    p = cb.and(p, cb.like(wrapped, "%," + needle + ",%"));
                    // match-any: p = cb.or(p, cb.like(wrapped, "%," + needle + ",%"));
                }
                return p;
            });
        }

        if (req.getHaveDriver() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("haveDriver"), req.getHaveDriver()));
        }

        if (req.getShipToAddress() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("shipToAddress"), req.getShipToAddress()));
        }

        if (req.getBrandId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("brand").get("id"), req.getBrandId()));
        }

        if (req.getModelId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("model").get("id"), req.getModelId()));
        }

        if (req.getNumberSeat() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("numberSeat"), req.getNumberSeat()));
        }

        if (req.getCostFrom() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("costPerDay"), req.getCostFrom()));
        }

        if (req.getCostTo() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("costPerDay"), req.getCostTo()));
        }

        if (req.getTransmission() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("transmission"), Vehicle.Transmission.valueOf(req.getTransmission())));
        }

        if (req.getFuelType() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("fuelType"), Vehicle.FuelType.valueOf(req.getFuelType())));
        }

        if (Boolean.TRUE.equals(req.getRatingFiveStarsOnly())) {
            spec = spec.and((root, query, cb) -> {
                var subquery = query.subquery(Double.class);
                var ratingRoot = subquery.from(Rating.class);
                subquery.select(cb.avg(ratingRoot.get("star")))
                        .where(cb.equal(ratingRoot.get("vehicle").get("id"), root.get("id")));
                return cb.equal(subquery, 5.0);
            });
        }

        // Kiểm tra xe rảnh trong khoảng thời gian yêu cầu
        if (timeFrom != null && timeTo != null) {
            List<String> busyVehicleIds = bookedTimeSlotsRepository.findBusyVehicleIds(timeFrom, timeTo);
            if (!busyVehicleIds.isEmpty()) {
                spec = spec.and((root, query, cb) -> cb.not(root.get("id").in(busyVehicleIds)));
            }
        }

        Page<Vehicle> result = vehicleRepository.findAll(spec, pageable);
        return result.map(vehicle -> {
            Double avgRating = ratingRepository.findAverageByVehicleId(vehicle.getId());

            List<String> features = Optional.ofNullable(vehicle.getVehicleFeatures())
                    .map(s -> Arrays.stream(s.split(","))
                            .map(String::trim)
                            .filter(t -> !t.isEmpty())
                            .distinct()
                            .collect(Collectors.toList()))
                    .orElse(Collections.emptyList());

            return VehicleSearchResultDTO.builder()
                    .id(vehicle.getId())
                    .licensePlate(vehicle.getLicensePlate())
                    .vehicleType(String.valueOf(vehicle.getVehicleType()))
                    .thumb(vehicle.getThumb())
                    .costPerDay(vehicle.getCostPerDay())
                    .status(vehicle.getStatus().name())
                    .brandName(vehicle.getBrand() != null ? vehicle.getBrand().getName() : "")
                    .modelName(vehicle.getModel() != null ? vehicle.getModel().getName() : "")
                    .numberSeat(vehicle.getNumberSeat())
                    .rating(avgRating != null ? avgRating : 0.0)
                    .address(vehicle.getUser() != null ? vehicle.getUser().getAddress() : "")
                    .vehicleImages(VehicleMapper.jsonToImageList(vehicle.getVehicleImages()))
                    .features(features)
                    .transmission(vehicle.getTransmission() != null ? vehicle.getTransmission().name() : null)
                    .fuelType(vehicle.getFuelType() != null ? vehicle.getFuelType().name() : null)
                    .build();
        });
    }

    @Override
    @Transactional
    public void deleteExpiredBookedTimeSlots() {
        LocalDateTime now = LocalDateTime.now();
        bookedTimeSlotsRepository.deleteAllByTimeToBefore(now);
    }

    @Override
    public Page<VehicleSearchResultDTO> basicSearch(String address, String type, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        // Lấy danh sách xe bận trong khoảng thời gian
        List<String> busyIds = bookedTimeSlotsRepository.findBusyVehicleIds(from, to);

        Vehicle.VehicleType vehicleTypeEnum = null;
        if (type != null && !type.isBlank()) {
            try {
                vehicleTypeEnum = Vehicle.VehicleType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid vehicle type: " + type);
            }
        }

        Page<Vehicle> result = vehicleRepository.findBasicSearch(address, vehicleTypeEnum, busyIds, pageable);

        return result.map(vehicle -> {
            Double avgRating = ratingRepository.findAverageByVehicleId(vehicle.getId());

            return VehicleSearchResultDTO.builder()
                    .id(vehicle.getId())
                    .licensePlate(vehicle.getLicensePlate())
                    .vehicleType(String.valueOf(vehicle.getVehicleType()))
                    .thumb(vehicle.getThumb())
                    .costPerDay(vehicle.getCostPerDay())
                    .status(vehicle.getStatus().name())
                    .brandName(vehicle.getBrand() != null ? vehicle.getBrand().getName() : "")
                    .modelName(vehicle.getModel() != null ? vehicle.getModel().getName() : "")
                    .numberSeat(vehicle.getNumberSeat())
                    .rating(avgRating != null ? avgRating : 0.0)
                    .address(vehicle.getUser() != null ? vehicle.getUser().getAddress() : "")
                    .vehicleImages(VehicleMapper.jsonToImageList(vehicle.getVehicleImages()))
                    .transmission(vehicle.getTransmission() != null ? vehicle.getTransmission().name() : null)
                    .fuelType(vehicle.getFuelType() != null ? vehicle.getFuelType().name() : null)
                    .build();
        });
    }

    @Override
    public List<VehicleGetDTO> createVehicleBulk(CreateVehicleDTO createVehicleDTO) {
        if (createVehicleDTO.getLicensePlate() == null || createVehicleDTO.getLicensePlate().trim().isEmpty()) {
            throw new RuntimeException("License plate is required");
        }
        if (createVehicleDTO.getCostPerDay() == null || createVehicleDTO.getCostPerDay().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Cost per day must be greater than 0");
        }

        // Check if license plate already exists
        boolean exists = vehicleRepository.existsByLicensePlate(createVehicleDTO.getLicensePlate());
        if (exists) {
            throw new RuntimeException("Vehicle with license plate " + createVehicleDTO.getLicensePlate() + " already exists");
        }

        // Validate foreign key references (optional - can be null)
        User user = null;
        if (createVehicleDTO.getUserId() != null && !createVehicleDTO.getUserId().trim().isEmpty()) {
            user = userRepository.findById(createVehicleDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + createVehicleDTO.getUserId()));
        }

        Brand brand = null;
        if (createVehicleDTO.getBrandId() != null && !createVehicleDTO.getBrandId().trim().isEmpty()) {
            brand = brandRepository.findById(createVehicleDTO.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + createVehicleDTO.getBrandId()));
        }

        Model model = null;
        if (createVehicleDTO.getModelId() != null && !createVehicleDTO.getModelId().trim().isEmpty()) {
            model = modelRepository.findById(createVehicleDTO.getModelId())
                    .orElseThrow(() -> new RuntimeException("Model not found with id: " + createVehicleDTO.getModelId()));
        }

        Penalty penalty = null;
        if (createVehicleDTO.getPenaltyId() != null && !createVehicleDTO.getPenaltyId().trim().isEmpty()) {
            penalty = penaltyRepository.findById(createVehicleDTO.getPenaltyId())
                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + createVehicleDTO.getPenaltyId()));
        }

        List<Vehicle> savedVehicles = new ArrayList<>();

        for (int i = 0; i < createVehicleDTO.getVehicleQuantity(); i++) {
            Vehicle vehicle = Vehicle.builder()
                    .user(user)
                    .brand(brand)
                    .model(model)
                    .penalty(penalty)
                    .vehicleFeatures(createVehicleDTO.getVehicleFeatures())
//                    .vehicleImages(createVehicleDTO.getVehicleImages())
                    .numberSeat(createVehicleDTO.getNumberSeat())
                    .yearManufacture(createVehicleDTO.getYearManufacture())
                    .description(createVehicleDTO.getDescription())
                    .numberVehicle(1)
                    .costPerDay(createVehicleDTO.getCostPerDay())
                    .thumb(createVehicleDTO.getThumb())
                    .totalRatings(0)
                    .likes(0)
//                    .status(Vehicle.Status.UNAVAILABLE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            // Set enum fields
            setEnums(createVehicleDTO, vehicle);

            // Xử lý ảnh xe
            if (createVehicleDTO.getVehicleImages() != null) {
                ObjectMapper mapper = new ObjectMapper();
                try {
                    String imagesJson = mapper.writeValueAsString(
                            createVehicleDTO.getVehicleImages()
                                    .stream()
                                    .map(VehicleImageDTO::getImageUrl)
                                    .collect(Collectors.toList())
                    );
                    vehicle.setVehicleImages(imagesJson);
                } catch (Exception e) {
                    vehicle.setVehicleImages("[]");
                }
            } else {
                vehicle.setVehicleImages("[]");
            }

            savedVehicles.add(vehicle);
        }

        vehicleRepository.saveAll(savedVehicles);

        return savedVehicles.stream().map(vehicleMapper::vehicleGet).collect(Collectors.toList());
    }

    private void setEnums(CreateVehicleDTO dto, Vehicle vehicle) {
        try {
            if (dto.getVehicleType() != null)
                vehicle.setVehicleType(Vehicle.VehicleType.valueOf(dto.getVehicleType().toUpperCase()));
            if (dto.getHaveDriver() != null)
                vehicle.setHaveDriver(Vehicle.HaveDriver.valueOf(dto.getHaveDriver().toUpperCase()));
            else
                vehicle.setHaveDriver(Vehicle.HaveDriver.NO);

            if (dto.getInsuranceStatus() != null)
                vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.valueOf(dto.getInsuranceStatus().toUpperCase()));
            else
                vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.NO);

            if (dto.getShipToAddress() != null)
                vehicle.setShipToAddress(Vehicle.ShipToAddress.valueOf(dto.getShipToAddress().toUpperCase()));
            else
                vehicle.setShipToAddress(Vehicle.ShipToAddress.NO);

            if (dto.getTransmission() != null)
                vehicle.setTransmission(Vehicle.Transmission.valueOf(dto.getTransmission().toUpperCase()));

            if (dto.getFuelType() != null)
                vehicle.setFuelType(Vehicle.FuelType.valueOf(dto.getFuelType().toUpperCase()));

            if (dto.getStatus() != null)
                vehicle.setStatus(Vehicle.Status.valueOf(dto.getStatus().toUpperCase()));
            else
                vehicle.setStatus(Vehicle.Status.UNAVAILABLE);

        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid enum value: " + e.getMessage());
        }
    }
    @Override
    public AvailableVehicleQuantityOnlyDTO getQuantityOfAvailableVehiclesByThumb(String thumb, String providerId, LocalDateTime from, LocalDateTime to) {
        List<String> busyVehicleIds = bookedTimeSlotsRepository.findBusyVehicleIds(from, to);

        List<Vehicle> availableVehicles = vehicleRepository
                .findByThumbAndUserIdAndStatus(thumb, providerId, Vehicle.Status.AVAILABLE)
                .stream()
                .filter(v -> !busyVehicleIds.contains(v.getId()))
                .toList();

        int totalQuantity = availableVehicles.size();


        return AvailableVehicleQuantityOnlyDTO.builder()
                .quantity(totalQuantity)
                .build();
    }
    @Override
    public AvailableVehicleListWithQuantityDTO getListAndQuantityOfAvailableVehiclesByThumb(String thumb, String providerId, LocalDateTime from, LocalDateTime to) {
        List<String> busyVehicleIds = bookedTimeSlotsRepository.findBusyVehicleIds(from, to);

        List<Vehicle> availableVehicles = vehicleRepository
                .findByThumbAndUserIdAndStatus(thumb, providerId, Vehicle.Status.AVAILABLE)
                .stream()
                .filter(v -> !busyVehicleIds.contains(v.getId()))
                .toList();

//        int totalQuantity = availableVehicles.stream()
//                .mapToInt(v -> v.getNumberVehicle() != null ? v.getNumberVehicle() : 1)
//                .sum();

        int totalQuantity = availableVehicles.size();


        List<VehicleGetDTO> data = availableVehicles.stream()
                .map(vehicleMapper::vehicleGet)
                .toList();

        return AvailableVehicleListWithQuantityDTO.builder()
                .quantity(totalQuantity)
                .data(data)
                .build();
    }
    @Override
    public List<VehicleGetDTO> getUserAvailableVehiclesByType(String userId, String vehicleType) {
        try {
            log.info("Nhận xe có sẵn cho người dùng: {} với loại: {}", userId, vehicleType);

            // Validate user exists
            if (!userRepository.existsById(userId)) {
                throw new RuntimeException("Không tìm thấy người dùng có ID: " + userId);
            }

            // Validate vehicle type
            Vehicle.VehicleType type;
            try {
                type = Vehicle.VehicleType.valueOf(vehicleType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Loại xe không hợp lệ:" + vehicleType + ". Các giá trị hợp lệ là: CAR, MOTORBIKE, BICYCLE");
            }

            // Get available vehicles by user and type
            List<Vehicle> vehicles = vehicleRepository.findByUserIdAndVehicleTypeAndStatusWithPenalty(
                    userId, type, Vehicle.Status.AVAILABLE);

            // Convert to DTOs
            List<VehicleGetDTO> vehicleDTOs = vehicles.stream()
                    .map(vehicleMapper::vehicleGet)
                    .collect(Collectors.toList());

            log.info("Đã truy xuất thành công {} xe {} có sẵn cho người dùng: {}",
                    vehicleDTOs.size(), vehicleType, userId);

            return vehicleDTOs;

        } catch (Exception e) {
            log.error("Lỗi khi tìm kiếm xe có sẵn cho người dùng: {} với loại: {}", userId, vehicleType, e);
            throw new RuntimeException("Không thể nhận được xe có sẵn: " + e.getMessage());
        }
    }
}