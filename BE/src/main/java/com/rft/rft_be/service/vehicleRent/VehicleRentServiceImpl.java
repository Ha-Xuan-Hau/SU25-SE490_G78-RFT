package com.rft.rft_be.service.vehicleRent;

import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.dto.vehicle.vehicleRent.*;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.ExtraFeeRuleMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final PenaltyRepository penaltyRepository;



    private final ExtraFeeRuleRepository extraFeeRuleRepository;
    private final ExtraFeeRuleMapper extraFeeRuleMapper;

    @Override
    public PageResponseDTO<VehicleGetDTO> getProviderCar( int page, int size, String sortBy, String sortDir) {

        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Getting cars for user: {}, page: {}, size: {}", userId, page, size);

        // Lấy tất cả xe ô tô của user
        List<Vehicle> cars = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.CAR);

        // Thực hiện phân trang thủ công
        int totalElements = cars.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<Vehicle> pagedCars = cars.subList(fromIndex, toIndex);

        List<VehicleGetDTO> vehicleResponses = pagedCars.stream()
                .map(vehicleMapper::vehicleGet)
                .collect(Collectors.toList());

        return PageResponseDTO.<VehicleGetDTO>builder()
                .content(vehicleResponses)
                .currentPage(page)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .size(size)
                .hasNext(page < totalPages - 1)
                .hasPrevious(page > 0)
                .first(page == 0)
                .last(page == totalPages - 1 || totalPages == 0)
                .build();
    }

    @Override
    @Transactional
    public VehicleGetDTO createVehicle(  VehicleRentCreateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Vehicle.VehicleType vehicleType;
        try {
            vehicleType = Vehicle.VehicleType.valueOf(request.getVehicleType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid vehicle type: " + request.getVehicleType() + ". Valid values are: CAR, MOTORBIKE, BICYCLE");
        }

        // Validate brand and model based on vehicle type
        Brand brand = null;
        Model model = null;

        List<String> licensePlates = request.getLicensePlate();

        String licensePlate = licensePlates.get(0); // Khởi tạo là null

        if (vehicleType == Vehicle.VehicleType.CAR) {
            // Car: require brand, model and license plate
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Car must have a valid brand. Not found: " + request.getBrandId()));
            model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new RuntimeException("Vehicle must have a valid model. Not found: " + request.getModelId()));

            // Validate license plate for CAR
            if (request.getLicensePlate() == null || request.getLicensePlate().isEmpty()) {
                throw new RuntimeException("Vehicle must have a license plate");
            }
            // Không gán licensePlate = request.getLicensePlate(); vì kiểu List<String>

        } else if (vehicleType == Vehicle.VehicleType.MOTORBIKE) {
            // Motorbike: require brand and license plate only
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Vehicle must have a valid brand. Not found: " + request.getBrandId()));

            // Validate license plate for MOTORBIKE
            if (request.getLicensePlate() == null || request.getLicensePlate().isEmpty()) {
                throw new RuntimeException("Vehicle must have a license plate");
            }
            // Không gán licensePlate = request.getLicensePlate(); vì kiểu List<String>

        } else if (vehicleType == Vehicle.VehicleType.BICYCLE) {
            // Bicycle: không cần brand, model, và license plate
            // licensePlate sẽ giữ nguyên là null
        }

        // Check if license plate already exists for this user (chỉ khi có license plate)
        if (licensePlate != null && vehicleRepository.existsByLicensePlateAndUserId(licensePlate, userId)) {
            throw new RuntimeException("License plate already exists for this user");
        }
        Penalty penalty = null;
        if (request.getPenaltyId() != null && !request.getPenaltyId().trim().isEmpty()) {
            penalty = penaltyRepository.findById(request.getPenaltyId())
                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + request.getPenaltyId()));
        }
        LocalDateTime now = LocalDateTime.now();

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .brand(brand)
                .model(model)
                .penalty(penalty)
                .licensePlate(licensePlate)
                .vehicleType(parseVehicleType(request.getVehicleType()))
                .vehicleFeatures(request.getVehicleFeatures())
//                .vehicleImages(request.getVehicleImages())
                .insuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()))
                .shipToAddress(parseShipToAddress(request.getShipToAddress()))
                .numberSeat(request.getNumberSeat())
                .yearManufacture(request.getYearManufacture())
                .transmission(parseTransmission(request.getTransmission()))
                .fuelType(parseFuelType(request.getFuelType()))
                .description(request.getDescription())
                .numberVehicle(request.getNumberVehicle())
                .costPerDay(request.getCostPerDay())
                .haveDriver(parseHaveDriver(request.getHaveDriver()))
                .thumb(request.getThumb())
                .status(Vehicle.Status.PENDING)
                .totalRatings(0)
                .likes(0)
                .build();

        if (request.getVehicleImages() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                String imagesJson = mapper.writeValueAsString(
                        request.getVehicleImages()
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

        // Manually set timestamps using reflection
        setTimestamps(vehicle, now, now);

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        ExtraFeeRule extraFeeRule = new ExtraFeeRule().builder()
                .vehicle(savedVehicle)
                .maxKmPerDay(request.getMaxKmPerDay())
                .feePerExtraKm(request.getFeePerExtraKm())
                .allowedHourLate(request.getAllowedHourLate())
                .feePerExtraHour(request.getFeePerExtraHour())
                .cleaningFee(request.getCleaningFee())
                .smellRemovalFee(request.getSmellRemovalFee())
                .applyBatteryChargeFee("ELECTRIC".equalsIgnoreCase(request.getFuelType()))
                .batteryChargeFeePerPercent(request.getBatteryChargeFeePerPercent())
                .driverFeePerDay(request.getDriverFeePerDay())
                .hasDriverOption(request.getHasDriverOption())
                .driverFeePerHour(request.getDriverFeePerHour())
                .hasHourlyRental(request.getHasHourlyRental())
                .build();

        extraFeeRuleRepository.save(extraFeeRule);

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(savedVehicle.getId())
                .orElse(savedVehicle);

        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    @Transactional
    public VehicleGetDTO updateVehicle( String vehicleId, VehicleRentUpdateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Updating vehicle: {} for user: {}", vehicleId, userId);

        Vehicle existingVehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to update it"));

        ExtraFeeRule extraFeeRule = extraFeeRuleRepository.findByVehicleId(vehicleId);

        // Update fields (only update non-null values from DTO)
        if (request.getLicensePlate() != null && !request.getLicensePlate().isEmpty()) {
            // Check if new license plate already exists (excluding current record)
            if (existingVehicle.getLicensePlate() != null &&
                    !existingVehicle.getLicensePlate().equals(request.getLicensePlate())) {
                boolean exists = vehicleRepository.existsByLicensePlate(request.getLicensePlate());
                if (exists) {
                    throw new RuntimeException("Vehicle with license plate " + request.getLicensePlate() + " already exists");
                }
            }
            else if (existingVehicle.getLicensePlate() == null &&
                    request.getLicensePlate() != null) {
                // Nếu DB là null mà DTO có biển số, cũng cần kiểm tra trùng
                boolean exists = vehicleRepository.existsByLicensePlate(request.getLicensePlate());
                if (exists) {
                    throw new RuntimeException("Vehicle with license plate " + request.getLicensePlate() + " already exists");
                }
            }
            existingVehicle.setLicensePlate(request.getLicensePlate());
        }
        // Validate brand if provided
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + request.getBrandId()));
            existingVehicle.setBrand(brand);
        }

        // Validate model if provided
        if (request.getModelId() != null) {
            Model model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new RuntimeException("Model not found with id: " + request.getModelId()));

            // If both brand and model are provided, validate they match
            String brandIdToCheck = request.getBrandId() != null ? request.getBrandId() :
                    (existingVehicle.getBrand() != null ? existingVehicle.getBrand().getId() : null);

            existingVehicle.setModel(model);
        }

        // Update penalty if provided
        if (request.getPenaltyId() != null && !request.getPenaltyId().trim().isEmpty()) {
            Penalty penalty = penaltyRepository.findById(request.getPenaltyId())
                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + request.getPenaltyId()));
            existingVehicle.setPenalty(penalty);
        }

        // Update other fields if provided
        if (request.getVehicleType() != null) existingVehicle.setVehicleType(parseVehicleType(request.getVehicleType()));
        if (request.getVehicleFeatures() != null) existingVehicle.setVehicleFeatures(request.getVehicleFeatures());
        if (request.getVehicleImages() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                String imagesJson = mapper.writeValueAsString(request.getVehicleImages()
                        .stream()
                        .map(VehicleImageDTO::getImageUrl)
                        .collect(Collectors.toList())
                );
                existingVehicle.setVehicleImages(imagesJson);
            } catch (Exception e) {
                // handle error
            }
        }

        if (request.getNumberSeat() != null) existingVehicle.setNumberSeat(request.getNumberSeat());
        if (request.getYearManufacture() != null) existingVehicle.setYearManufacture(request.getYearManufacture());
        if (request.getDescription() != null) existingVehicle.setDescription(request.getDescription());
        if (request.getNumberVehicle() != null) existingVehicle.setNumberVehicle(request.getNumberVehicle());
        if (request.getCostPerDay() != null) existingVehicle.setCostPerDay(request.getCostPerDay());
        if (request.getMaxKmPerDay() != null) extraFeeRule.setMaxKmPerDay(request.getMaxKmPerDay());
        if (request.getFeePerExtraKm() != null) extraFeeRule.setFeePerExtraKm(request.getFeePerExtraKm());
        if (request.getAllowedHourLate() != null) extraFeeRule.setAllowedHourLate(request.getAllowedHourLate());
        if (request.getFeePerExtraHour() != null) extraFeeRule.setFeePerExtraHour(request.getFeePerExtraHour());
        if (request.getCleaningFee() != null) extraFeeRule.setCleaningFee(request.getCleaningFee());
        if (request.getSmellRemovalFee() != null) extraFeeRule.setSmellRemovalFee(request.getSmellRemovalFee());
        extraFeeRule.setApplyBatteryChargeFee("ELECTRIC".equalsIgnoreCase(request.getFuelType()));
        if (request.getBatteryChargeFeePerPercent() != null) extraFeeRule.setBatteryChargeFeePerPercent(request.getBatteryChargeFeePerPercent());
        if (request.getDriverFeePerDay() != null) extraFeeRule.setDriverFeePerDay(request.getDriverFeePerDay());
        if (request.getHasDriverOption() != null) extraFeeRule.setHasDriverOption(request.getHasDriverOption());
        if (request.getDriverFeePerHour() != null) extraFeeRule.setDriverFeePerHour(request.getDriverFeePerHour());
        if (request.getHasHourlyRental() != null) extraFeeRule.setHasHourlyRental(request.getHasHourlyRental());

        // Update enum fields
        if (request.getVehicleType() != null && !request.getVehicleType().trim().isEmpty()) {
            try {
                existingVehicle.setVehicleType(Vehicle.VehicleType.valueOf(request.getVehicleType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid vehicle type: " + request.getVehicleType() + ". Valid values are: CAR, MOTORBIKE, BICYCLE");
            }
        }

        if (request.getHaveDriver() != null && !request.getHaveDriver().trim().isEmpty()) {
            try {
                existingVehicle.setHaveDriver(Vehicle.HaveDriver.valueOf(request.getHaveDriver().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid have driver: " + request.getHaveDriver() + ". Valid values are: YES, NO");
            }
        }

        if (request.getInsuranceStatus() != null && !request.getInsuranceStatus().trim().isEmpty()) {
            try {
                existingVehicle.setInsuranceStatus(Vehicle.InsuranceStatus.valueOf(request.getInsuranceStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid insurance status: " + request.getInsuranceStatus() + ". Valid values are: YES, NO");
            }
        }

        if (request.getShipToAddress() != null && !request.getShipToAddress().trim().isEmpty()) {
            try {
                existingVehicle.setShipToAddress(Vehicle.ShipToAddress.valueOf(request.getShipToAddress().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid ship to address: " + request.getShipToAddress() + ". Valid values are: YES, NO");
            }
        }

        if (request.getTransmission() != null && !request.getTransmission().trim().isEmpty()) {
            try {
                existingVehicle.setTransmission(Vehicle.Transmission.valueOf(request.getTransmission().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid transmission: " + request.getTransmission() + ". Valid values are: MANUAL, AUTOMATIC");
            }
        }

        if (request.getFuelType() != null && !request.getFuelType().trim().isEmpty()) {
            try {
                existingVehicle.setFuelType(Vehicle.FuelType.valueOf(request.getFuelType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid fuel type: " + request.getFuelType() + ". Valid values are: GASOLINE, ELECTRIC");
            }
        }

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                existingVehicle.setStatus(Vehicle.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + request.getStatus() + ". Valid values are: AVAILABLE, UNAVAILABLE");
            }
        }
        // Manually set updatedAt timestamp using reflection
        LocalDateTime now = LocalDateTime.now();
        setUpdatedAt(existingVehicle, now);

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
                .orElse(updatedVehicle);

        log.info("Vehicle updated successfully: {}", vehicleId);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }
//    @Override
//    @Transactional
//    public void deleteVehicle( String vehicleId) {
//        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
//        String userId = authentication.getToken().getClaim("userId");
//        log.info("Deleting vehicle: {} for user: {}", vehicleId, userId);
//
//        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
//                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to delete it"));
//
//        // Delete the vehicle
//        vehicleRepository.delete(vehicle);
//
//        log.info("Vehicle deleted successfully: {}", vehicleId);
//    }

    @Override
    public VehicleDetailDTO getVehicleById( String vehicleId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Getting vehicle: {} for user: {}", vehicleId, userId);

        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to view it"));
        VehicleDetailDTO dto = vehicleMapper.vehicleToVehicleDetail(vehicle);
        dto.setExtraFeeRule(extraFeeRuleMapper.toDto(extraFeeRuleRepository.findByVehicleId(vehicleId)));

        return dto;
    }

    @Override
    public long countUserVehicles(String userId) {
        return vehicleRepository.countByUserId(userId);
    }

    @Override
    @Transactional
    public VehicleGetDTO toggleVehicleStatus( String vehicleId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền cập nhật xe"));

        // Validate vehicle information before allowing status change to AVAILABLE
        if (vehicle.getStatus() == Vehicle.Status.UNAVAILABLE) {
            validateVehicleForAvailability(vehicle);
        }

        // Toggle status
        Vehicle.Status newStatus = vehicle.getStatus() == Vehicle.Status.AVAILABLE
                ? Vehicle.Status.UNAVAILABLE
                : Vehicle.Status.AVAILABLE;

        vehicle.setStatus(newStatus);

        // Update timestamp
        LocalDateTime now = LocalDateTime.now();
        setUpdatedAt(vehicle, now);

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
                .orElse(updatedVehicle);

        log.info("Đã chuyển đổi trạng thái xe thành công: {} -> {}", vehicleId, newStatus);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    public PageResponseDTO<VehicleThumbGroupDTO> getProviderCarGrouped(int page, int size, String sortBy, String sortDir) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        List<Vehicle> carListAll = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.CAR);

        // Group by thumb and status
        Map<String, List<Vehicle>> grouped = carListAll.stream()
                .collect(Collectors.groupingBy(v -> {
                    String thumb = v.getThumb() != null ? v.getThumb() : "Khác";
                    String status = v.getStatus() != null ? v.getStatus().toString() : "UNKNOWN";
                    
                    return thumb + "|" + status;
                }));

        List<VehicleThumbGroupDTO> groupList = grouped.entrySet().stream()
                .map(entry -> {
                    String[] keyParts = entry.getKey().split("\\|");
                    String thumb = keyParts[0];
                    
                    // Sắp xếp xe trong nhóm theo createdAt giảm dần (mới nhất lên đầu)
                    List<VehicleDetailDTO> sortedVehicles = entry.getValue().stream()
                            .sorted((v1, v2) -> {
                                LocalDateTime createdAt1 = v1.getCreatedAt();
                                LocalDateTime createdAt2 = v2.getCreatedAt();
                                if (createdAt1 == null && createdAt2 == null) return 0;
                                if (createdAt1 == null) return 1;
                                if (createdAt2 == null) return -1;
                                return createdAt2.compareTo(createdAt1); // Giảm dần
                            })
                            .map(vehicleMapper::vehicleToVehicleDetail)
                            .collect(Collectors.toList());
                    
                    return VehicleThumbGroupDTO.builder()
                            .thumb(thumb)
                            .vehicle(sortedVehicles)
                            .vehicleNumber(entry.getValue().size())
                            .build();
                })
                .collect(Collectors.toList());

        // Manual pagination
        int totalElements = groupList.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<VehicleThumbGroupDTO> pagedContent = groupList.subList(fromIndex, toIndex);

        return PageResponseDTO.<VehicleThumbGroupDTO>builder()
                .content(pagedContent)
                .currentPage(page)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .size(size)
                .hasNext(page < totalPages - 1)
                .hasPrevious(page > 0)
                .first(page == 0)
                .last(page == totalPages - 1 || totalPages == 0)
                .build();
    }

    @Override
    public PageResponseDTO<VehicleThumbGroupDTO> getProviderMotorbikeGroupedByThumb(int page, int size, String sortBy, String sortDir) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        List<Vehicle> motorbikes = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.MOTORBIKE);
        
        // Group by thumb and status
        Map<String, List<Vehicle>> grouped = motorbikes.stream()
                .collect(Collectors.groupingBy(v -> {
                    String thumb = v.getThumb() != null ? v.getThumb() : "Khác";
                    String status = v.getStatus() != null ? v.getStatus().toString() : "UNKNOWN";
                    
                    return thumb + "|" + status;
                }));
        
        List<VehicleThumbGroupDTO> groupList = grouped.entrySet().stream()
                .map(entry -> {
                    String[] keyParts = entry.getKey().split("\\|");
                    String thumb = keyParts[0];
                    
                    // Sắp xếp xe trong nhóm theo createdAt giảm dần (mới nhất lên đầu)
                    List<VehicleDetailDTO> sortedVehicles = entry.getValue().stream()
                            .sorted((v1, v2) -> {
                                LocalDateTime createdAt1 = v1.getCreatedAt();
                                LocalDateTime createdAt2 = v2.getCreatedAt();
                                if (createdAt1 == null && createdAt2 == null) return 0;
                                if (createdAt1 == null) return 1;
                                if (createdAt2 == null) return -1;
                                return createdAt2.compareTo(createdAt1); // Giảm dần
                            })
                            .map(vehicleMapper::vehicleToVehicleDetail)
                            .collect(Collectors.toList());
                    
                    return VehicleThumbGroupDTO.builder()
                            .thumb(thumb)
                            .vehicle(sortedVehicles)
                        .vehicleNumber(entry.getValue().size())
                            .build();
                })
                .collect(Collectors.toList());

        // Manual pagination
        int totalElements = groupList.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<VehicleThumbGroupDTO> pagedContent = groupList.subList(fromIndex, toIndex);

        return PageResponseDTO.<VehicleThumbGroupDTO>builder()
                .content(pagedContent)
                .currentPage(page)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .size(size)
                .hasNext(page < totalPages - 1)
                .hasPrevious(page > 0)
                .first(page == 0)
                .last(page == totalPages - 1 || totalPages == 0)
                .build();
    }

    @Override
    public PageResponseDTO<VehicleThumbGroupDTO> getProviderBicycleGroupedByThumb(int page, int size, String sortBy, String sortDir) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        List<Vehicle> bicycles = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.BICYCLE);
        
        // Group by thumb and status
        Map<String, List<Vehicle>> grouped = bicycles.stream()
                .collect(Collectors.groupingBy(v -> {
                    String thumb = v.getThumb() != null ? v.getThumb() : "Khác";
                    String status = v.getStatus() != null ? v.getStatus().toString() : "UNKNOWN";
                    
                    return thumb + "|" + status;
                }));
        
        List<VehicleThumbGroupDTO> groupList = grouped.entrySet().stream()
                .map(entry -> {
                    String[] keyParts = entry.getKey().split("\\|");
                    String thumb = keyParts[0];
                    
                    // Sắp xếp xe trong nhóm theo createdAt giảm dần (mới nhất lên đầu)
                    List<VehicleDetailDTO> sortedVehicles = entry.getValue().stream()
                            .sorted((v1, v2) -> {
                                LocalDateTime createdAt1 = v1.getCreatedAt();
                                LocalDateTime createdAt2 = v2.getCreatedAt();
                                if (createdAt1 == null && createdAt2 == null) return 0;
                                if (createdAt1 == null) return 1;
                                if (createdAt2 == null) return -1;
                                return createdAt2.compareTo(createdAt1); // Giảm dần
                            })
                            .map(vehicleMapper::vehicleToVehicleDetail)
                            .collect(Collectors.toList());
                    
                    return VehicleThumbGroupDTO.builder()
                            .thumb(thumb)
                            .vehicle(sortedVehicles)
                        .vehicleNumber(entry.getValue().size())
                            .build();
                })
                .collect(Collectors.toList());

        // Manual pagination
        int totalElements = groupList.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<VehicleThumbGroupDTO> pagedContent = groupList.subList(fromIndex, toIndex);

        return PageResponseDTO.<VehicleThumbGroupDTO>builder()
                .content(pagedContent)
                .currentPage(page)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .size(size)
                .hasNext(page < totalPages - 1)
                .hasPrevious(page > 0)
                .first(page == 0)
                .last(page == totalPages - 1 || totalPages == 0)
                .build();
    }

    @Override
    public List<VehicleGetDTO> createMotorbie_Bicycle(VehicleRentCreateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        // Lấy danh sách biển số và số lượng xe
        List<String> licensePlates = request.getLicensePlate();
        int numberVehicle = request.getNumberVehicle() != null ? request.getNumberVehicle() : 1;

        // Kiểm tra số lượng biển số hợp lệ
        boolean isBicycle = "BICYCLE".equalsIgnoreCase(request.getVehicleType());
        if (!isBicycle && (licensePlates == null || licensePlates.size() != numberVehicle)) {
            log.error("[VehicleRent] Số lượng biển số không hợp lệ. Số lượng biển số: {}, số lượng xe: {}", licensePlates != null ? licensePlates.size() : 0, numberVehicle);
            throw new RuntimeException("Số lượng biển số xe phải bằng số lượng xe");
        }

        // Chỉ cho phép motorbike và bicycle
        String type = request.getVehicleType();
        boolean isMotorbike = "MOTORBIKE".equalsIgnoreCase(type);
        //boolean isBicycle = "BICYCLE".equalsIgnoreCase(type);

        // Tìm các xe cùng thumb và user
        List<Vehicle> sameThumbVehicles = vehicleRepository.findByUserId(userId).stream()
                .filter(v -> request.getThumb() != null && request.getThumb().equals(v.getThumb()))
                .collect(Collectors.toList());

        List<VehicleGetDTO> createdVehicles = new ArrayList<>();

        if (!sameThumbVehicles.isEmpty()) {
            // Kiểm tra xem có xe nào giống hết tất cả các trường (trừ licensePlate, vehicleImages và description) không
            boolean hasMatchingVehicle = sameThumbVehicles.stream().anyMatch(v -> {
                // Kiểm tra vehicleType
                boolean typeMatch = v.getVehicleType().equals(parseVehicleType(request.getVehicleType()));
                
                // Kiểm tra brand (chỉ cho xe máy, xe đạp không cần)
                boolean brandMatch = true;
                if (isMotorbike) {
                    if (request.getBrandId() != null && v.getBrand() != null) {
                        brandMatch = request.getBrandId().equals(v.getBrand().getId());
                    } else if (request.getBrandId() == null && v.getBrand() == null) {
                        brandMatch = true;
                    } else {
                        brandMatch = false;
                    }
                }
                // Xe đạp không cần kiểm tra brand
                
                // Không cần kiểm tra model cho xe máy và xe đạp
                boolean modelMatch = true;
                
                // Kiểm tra penalty
                boolean penaltyMatch = false;
                if (request.getPenaltyId() != null && v.getPenalty() != null) {
                    penaltyMatch = request.getPenaltyId().equals(v.getPenalty().getId());
                } else if (request.getPenaltyId() == null && v.getPenalty() == null) {
                    penaltyMatch = true;
                }
                
                // Kiểm tra vehicleFeatures
                boolean featuresMatch = false;
                if (request.getVehicleFeatures() != null && v.getVehicleFeatures() != null) {
                    featuresMatch = request.getVehicleFeatures().equals(v.getVehicleFeatures());
                } else if (request.getVehicleFeatures() == null && v.getVehicleFeatures() == null) {
                    featuresMatch = true;
                }
                
                // Kiểm tra insuranceStatus (có giá trị mặc định)
                boolean insuranceMatch = false;
                Vehicle.InsuranceStatus requestInsurance = parseInsuranceStatus(request.getInsuranceStatus());
                if (v.getInsuranceStatus() != null && requestInsurance != null) {
                    insuranceMatch = v.getInsuranceStatus().equals(requestInsurance);
                } else if (v.getInsuranceStatus() == null && requestInsurance == null) {
                    insuranceMatch = true;
                } else if (v.getInsuranceStatus() == Vehicle.InsuranceStatus.NO && requestInsurance == Vehicle.InsuranceStatus.NO) {
                    insuranceMatch = true;
                }
                
                // Kiểm tra shipToAddress (có giá trị mặc định)
                boolean shipMatch = false;
                Vehicle.ShipToAddress requestShip = parseShipToAddress(request.getShipToAddress());
                if (v.getShipToAddress() != null && requestShip != null) {
                    shipMatch = v.getShipToAddress().equals(requestShip);
                } else if (v.getShipToAddress() == null && requestShip == null) {
                    shipMatch = true;
                } else if (v.getShipToAddress() == Vehicle.ShipToAddress.NO && requestShip == Vehicle.ShipToAddress.NO) {
                    shipMatch = true;
                }
                
                // Kiểm tra numberSeat
                boolean seatMatch = false;
                if (request.getNumberSeat() != null && v.getNumberSeat() != null) {
                    seatMatch = request.getNumberSeat().equals(v.getNumberSeat());
                } else if (request.getNumberSeat() == null && v.getNumberSeat() == null) {
                    seatMatch = true;
                }
                
                // Kiểm tra yearManufacture
                boolean yearMatch = false;
                if (request.getYearManufacture() != null && v.getYearManufacture() != null) {
                    yearMatch = request.getYearManufacture().equals(v.getYearManufacture());
                } else if (request.getYearManufacture() == null && v.getYearManufacture() == null) {
                    yearMatch = true;
                }
                
                // Kiểm tra transmission
                boolean transmissionMatch = false;
                if (request.getTransmission() != null && v.getTransmission() != null) {
                    transmissionMatch = v.getTransmission().equals(parseTransmission(request.getTransmission()));
                } else if (request.getTransmission() == null && v.getTransmission() == null) {
                    transmissionMatch = true;
                }
                
                // Kiểm tra fuelType
                boolean fuelMatch = false;
                if (request.getFuelType() != null && v.getFuelType() != null) {
                    fuelMatch = v.getFuelType().equals(parseFuelType(request.getFuelType()));
                } else if (request.getFuelType() == null && v.getFuelType() == null) {
                    fuelMatch = true;
                }
                
                // Kiểm tra costPerDay
                boolean costMatch = false;
                if (request.getCostPerDay() != null && v.getCostPerDay() != null) {
                    costMatch = request.getCostPerDay().compareTo(v.getCostPerDay()) == 0;
                } else if (request.getCostPerDay() == null && v.getCostPerDay() == null) {
                    costMatch = true;
                }
                
                // Kiểm tra haveDriver (có giá trị mặc định)
                boolean driverMatch = false;
                Vehicle.HaveDriver requestDriver = parseHaveDriver(request.getHaveDriver());
                if (request.getHaveDriver() != null && v.getHaveDriver() != null) {
                    driverMatch = v.getHaveDriver().equals(requestDriver);
                } else if (request.getHaveDriver() == null && v.getHaveDriver() == null) {
                    driverMatch = true;
                } else if (v.getHaveDriver() == Vehicle.HaveDriver.NO && requestDriver == Vehicle.HaveDriver.NO) {
                    driverMatch = true;
                } else if (v.getHaveDriver() == null && requestDriver == Vehicle.HaveDriver.NO) {
                    // Xe cũ có driver = null, request có driver = NO -> coi như giống nhau
                    driverMatch = true;
                } else if (v.getHaveDriver() == Vehicle.HaveDriver.NO && requestDriver == null) {
                    // Xe cũ có driver = NO, request có driver = null -> coi như giống nhau
                    driverMatch = true;
                }
                
                boolean allMatch = typeMatch && brandMatch && modelMatch && penaltyMatch && featuresMatch && 
                       insuranceMatch && shipMatch && seatMatch && yearMatch && transmissionMatch && 
                       fuelMatch && costMatch && driverMatch;
                
                // Log để debug
                if (!allMatch) {
                    log.info("[VehicleRent] Debug - Vehicle ID: {}, Type: {}, Brand: {}, Model: {}, Penalty: {}, Features: {}, Insurance: {}, Ship: {}, Seat: {}, Year: {}, Transmission: {}, Fuel: {}, Cost: {}, Driver: {}", 
                        v.getId(), typeMatch, brandMatch, modelMatch, penaltyMatch, featuresMatch, insuranceMatch, shipMatch, seatMatch, yearMatch, transmissionMatch, fuelMatch, costMatch, driverMatch);
                }
                
                return allMatch;
            });
            
            if (hasMatchingVehicle) {
                log.info("[VehicleRent] Thumb '{}' đã tồn tại với cùng tất cả thông tin (trừ licensePlate, vehicleImages và description) cho user {}. Cho phép tạo xe mới.", request.getThumb(), userId);
            } else {
                log.error("[VehicleRent] Thumb '{}' đã tồn tại nhưng khác thông tin cho user {}. Không cho phép tạo xe mới.", request.getThumb(), userId);
                
                // Log chi tiết để debug
                Vehicle existingVehicle = sameThumbVehicles.get(0);
                log.info("[VehicleRent] Debug - Request values: vehicleType={}, brandId={}, modelId={}, penaltyId={}, features={}, insurance={}, ship={}, seat={}, year={}, transmission={}, fuel={}, cost={}, driver={}", 
                    request.getVehicleType(), request.getBrandId(), request.getModelId(), request.getPenaltyId(), 
                    request.getVehicleFeatures(), request.getInsuranceStatus(), request.getShipToAddress(), 
                    request.getNumberSeat(), request.getYearManufacture(), request.getTransmission(), 
                    request.getFuelType(), request.getCostPerDay(), request.getHaveDriver());
                
                log.info("[VehicleRent] Debug - Existing vehicle values: vehicleType={}, brandId={}, modelId={}, penaltyId={}, features={}, insurance={}, ship={}, seat={}, year={}, transmission={}, fuel={}, cost={}, driver={}", 
                    existingVehicle.getVehicleType(), 
                    existingVehicle.getBrand() != null ? existingVehicle.getBrand().getId() : null,
                    existingVehicle.getModel() != null ? existingVehicle.getModel().getId() : null,
                    existingVehicle.getPenalty() != null ? existingVehicle.getPenalty().getId() : null,
                    existingVehicle.getVehicleFeatures(), existingVehicle.getInsuranceStatus(), 
                    existingVehicle.getShipToAddress(), existingVehicle.getNumberSeat(), 
                    existingVehicle.getYearManufacture(), existingVehicle.getTransmission(), 
                    existingVehicle.getFuelType(), existingVehicle.getCostPerDay(), existingVehicle.getHaveDriver());
                
                throw new RuntimeException("Thumb '" + request.getThumb() + "' đã tồn tại. Không thể tạo xe mới với thumb này.");
            }
            
            // Tạo xe mới với thông tin từ form
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            Vehicle.VehicleType vehicleType = parseVehicleType(request.getVehicleType());
            int loopCount = isBicycle ? numberVehicle : licensePlates.size();
            for (int i = 0; i < loopCount; i++) {
                String plate = isBicycle ? null : licensePlates.get(i);
                if (vehicleRepository.existsByLicensePlateAndUserId(plate, userId) && !isBicycle) {
                    log.error("[VehicleRent] Biển số xe đã tồn tại: {}", plate);
                    throw new RuntimeException("Biển số xe đã tồn tại: " + plate);
                }
                log.info("[VehicleRent] Tạo mới xe với biển số: {} cho user: {}", plate, userId);
                Vehicle.VehicleBuilder builder = Vehicle.builder()
                        .user(user)
                        .penalty(request.getPenaltyId() != null ? penaltyRepository.findById(request.getPenaltyId()).orElse(null) : null)
                        .vehicleType(vehicleType)
                        .vehicleFeatures(request.getVehicleFeatures())
                        .insuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()))
                        .shipToAddress(parseShipToAddress(request.getShipToAddress()))
                        .numberSeat(request.getNumberSeat())
                        .yearManufacture(request.getYearManufacture())
                        .transmission(parseTransmission(request.getTransmission()))
                        .fuelType(parseFuelType(request.getFuelType()))
                        .description(request.getDescription())
                        .costPerDay(request.getCostPerDay())
                        .status(Vehicle.Status.PENDING)
                        .thumb(request.getThumb())
                        .numberVehicle(1)
                        .likes(0)
                        .totalRatings(0);
                if (isMotorbike) {
                    builder.brand(request.getBrandId() != null ? brandRepository.findById(request.getBrandId()).orElse(null) : null);
                }
                if (!isBicycle) {
                    builder.licensePlate(plate);
                }
                Vehicle newVehicle = builder.build();
                if (request.getVehicleImages() != null) {
                    ObjectMapper mapper = new ObjectMapper();
                    try {
                        String imagesJson = mapper.writeValueAsString(
                                request.getVehicleImages()
                                        .stream()
                                        .map(VehicleImageDTO::getImageUrl)
                                        .collect(Collectors.toList())
                        );
                        newVehicle.setVehicleImages(imagesJson);
                    } catch (Exception e) {
                        newVehicle.setVehicleImages("[]");
                    }
                } else {
                    newVehicle.setVehicleImages("[]");
                }
                setTimestamps(newVehicle, LocalDateTime.now(), LocalDateTime.now());
                Vehicle savedVehicle = vehicleRepository.save(newVehicle);
                log.info("[VehicleRent] Đã lưu xe mới với biển số: {} thành công.", plate);
                createdVehicles.add(vehicleMapper.vehicleGet(savedVehicle));
            }
            log.info("[VehicleRent] Hoàn thành tạo mới {} xe với thumb: {} cho user: {} (khác thông tin cơ bản)", createdVehicles.size(), request.getThumb(), userId);
            return createdVehicles;

        } else {
            log.info("[VehicleRent] Không tìm thấy xe cùng thumb cho user {}. Tiến hành tạo mới {} xe.", userId, numberVehicle);
            // Nếu chưa có xe cùng thumb: tạo mới numberVehicle xe, mỗi xe 1 biển số
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            Vehicle.VehicleType vehicleType = parseVehicleType(request.getVehicleType());
            int loopCount = isBicycle ? numberVehicle : licensePlates.size();
            for (int i = 0; i < loopCount; i++) {
                String plate = isBicycle ? null : licensePlates.get(i);
                if (vehicleRepository.existsByLicensePlateAndUserId(plate, userId) && !isBicycle) {
                    log.error("[VehicleRent] Biển số xe đã tồn tại: {}", plate);
                    throw new RuntimeException("Biển số xe đã tồn tại: " + plate);
                }
                log.info("[VehicleRent] Tạo mới xe với biển số: {} cho user: {}", plate, userId);
                Vehicle.VehicleBuilder builder = Vehicle.builder()
                        .user(user)
                        .penalty(request.getPenaltyId() != null ? penaltyRepository.findById(request.getPenaltyId()).orElse(null) : null)
                        .vehicleType(vehicleType)
                        .vehicleFeatures(request.getVehicleFeatures())
                        .insuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()))
                        .shipToAddress(parseShipToAddress(request.getShipToAddress()))
                        .numberSeat(request.getNumberSeat())
                        .yearManufacture(request.getYearManufacture())
                        .transmission(parseTransmission(request.getTransmission()))
                        .fuelType(parseFuelType(request.getFuelType()))
                        .description(request.getDescription())
                        .costPerDay(request.getCostPerDay())
                        .status(Vehicle.Status.PENDING)
                        .thumb(request.getThumb())
                        .numberVehicle(numberVehicle)
                        .likes(0)
                        .totalRatings(0);
                if (isMotorbike) {
                    builder.brand(request.getBrandId() != null ? brandRepository.findById(request.getBrandId()).orElse(null) : null);
                    // Không set model
                }
                // Nếu không phải bicycle thì set licensePlate
                if (!isBicycle) {
                    builder.licensePlate(plate);
                }
                // Bicycle: không set brand, model, licensePlate
                Vehicle newVehicle = builder.build();
                if (request.getVehicleImages() != null) {
                    ObjectMapper mapper = new ObjectMapper();
                    try {
                        String imagesJson = mapper.writeValueAsString(
                                request.getVehicleImages()
                                        .stream()
                                        .map(VehicleImageDTO::getImageUrl)
                                        .collect(Collectors.toList())
                        );
                        newVehicle.setVehicleImages(imagesJson);
                    } catch (Exception e) {
                        newVehicle.setVehicleImages("[]");
                    }
                } else {
                    newVehicle.setVehicleImages("[]");
                }
                setTimestamps(newVehicle, LocalDateTime.now(), LocalDateTime.now());
                Vehicle savedVehicle = vehicleRepository.save(newVehicle);
                log.info("Đã lưu xe mới với biển số: {} thành công.", plate);
                createdVehicles.add(vehicleMapper.vehicleGet(savedVehicle));
            }
            log.info("[VehicleRent] Hoàn thành tạo mới {} xe với thumb: {} cho user: {} (khác thumb)", createdVehicles.size(), request.getThumb(), userId);
            return createdVehicles;
        }
    }

    @Override
    public VehicleGetDTO updateCommonVehicleInfo(String vehicleId, VehicleRentUpdateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to update it"));

        // Cập nhật các trường chung
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Brand not found with id: " + request.getBrandId()));
            vehicle.setBrand(brand);
        }
        if (request.getVehicleType() != null) {
            vehicle.setVehicleType(parseVehicleType(request.getVehicleType()));
        }
        if (request.getVehicleFeatures() != null) {
            vehicle.setVehicleFeatures(request.getVehicleFeatures());
        }
        if (request.getInsuranceStatus() != null) {
            vehicle.setInsuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()));
        }
        if (request.getShipToAddress() != null) {
            vehicle.setShipToAddress(parseShipToAddress(request.getShipToAddress()));
        }
        if (request.getNumberSeat() != null) {
            vehicle.setNumberSeat(request.getNumberSeat());
        }
        if (request.getYearManufacture() != null) {
            vehicle.setYearManufacture(request.getYearManufacture());
        }
        if (request.getTransmission() != null) {
            vehicle.setTransmission(parseTransmission(request.getTransmission()));
        }
        if (request.getFuelType() != null) {
            vehicle.setFuelType(parseFuelType(request.getFuelType()));
        }
        if (request.getDescription() != null) {
            vehicle.setDescription(request.getDescription());
        }
        if (request.getCostPerDay() != null) {
            vehicle.setCostPerDay(request.getCostPerDay());
        }
        if (request.getStatus() != null) {
            vehicle.setStatus(parseStatus(request.getStatus()));
        }
        if (request.getThumb() != null) {
            vehicle.setThumb(request.getThumb());
        }
        if (request.getNumberVehicle() != null) {
            vehicle.setNumberVehicle(request.getNumberVehicle());
        }

        setUpdatedAt(vehicle, LocalDateTime.now());
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
                .orElse(updatedVehicle);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    public VehicleGetDTO updateSpecificVehicleInfo(String vehicleId, VehicleRentUpdateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vehicleId));
        // Chỉ cập nhật các trường riêng biệt
        if (request.getLicensePlate() != null) vehicle.setLicensePlate(request.getLicensePlate());
        if (request.getVehicleImages() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                String imagesJson = mapper.writeValueAsString(
                        request.getVehicleImages()
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
        setUpdatedAt(vehicle, LocalDateTime.now());
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
                .orElse(updatedVehicle);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    private void validateVehicleForAvailability(Vehicle vehicle) {
        StringBuilder missingFields = new StringBuilder();

        // Check required fields for all vehicle types
        if (vehicle.getCostPerDay() == null || vehicle.getCostPerDay().compareTo(BigDecimal.ZERO) <= 0) {
            missingFields.append("cost_per_day, ");
        }
        if (vehicle.getDescription() == null || vehicle.getDescription().trim().isEmpty()) {
            missingFields.append("description, ");
        }
        if (vehicle.getVehicleImages() == null || vehicle.getVehicleImages().trim().isEmpty()) {
            missingFields.append("vehicle_images, ");
        }
        if (vehicle.getThumb() == null || vehicle.getThumb().trim().isEmpty()) {
            missingFields.append("thumb, ");
        }

        // Check vehicle type specific requirements
        switch (vehicle.getVehicleType()) {
            case CAR:
                validateCarRequirements(vehicle, missingFields);
                break;
            case MOTORBIKE:
                validateMotorbikeRequirements(vehicle, missingFields);
                break;
            case BICYCLE:
                validateBicycleRequirements(vehicle, missingFields);
                break;
        }

        if (missingFields.length() > 0) {
            missingFields.setLength(missingFields.length() - 2); // Remove last ", "
            throw new RuntimeException("Không thể đặt xe thành CÓ SẴN. Thiếu các trường bắt buộc: " + missingFields.toString());
        }
    }

    private void validateCarRequirements(Vehicle vehicle, StringBuilder missingFields) {
        if (vehicle.getBrand() == null) {
            missingFields.append("brand, ");
        }
        if (vehicle.getModel() == null) {
            missingFields.append("model, ");
        }
        if (vehicle.getLicensePlate() == null || vehicle.getLicensePlate().trim().isEmpty()) {
            missingFields.append("license_plate, ");
        }
        if (vehicle.getNumberSeat() == null || vehicle.getNumberSeat() <= 0) {
            missingFields.append("number_seat, ");
        }
        if (vehicle.getYearManufacture() == null || vehicle.getYearManufacture() <= 0) {
            missingFields.append("year_manufacture, ");
        }
        if (vehicle.getTransmission() == null) {
            missingFields.append("transmission, ");
        }
        if (vehicle.getFuelType() == null) {
            missingFields.append("fuel_type, ");
        }
        if (vehicle.getInsuranceStatus() == null) {
            missingFields.append("insurance_status, ");
        }
        if (vehicle.getShipToAddress() == null) {
            missingFields.append("ship_to_address, ");
        }
    }

    private void validateMotorbikeRequirements(Vehicle vehicle, StringBuilder missingFields) {
        if (vehicle.getBrand() == null) {
            missingFields.append("brand, ");
        }
        if (vehicle.getLicensePlate() == null || vehicle.getLicensePlate().trim().isEmpty()) {
            missingFields.append("license_plate, ");
        }
        if (vehicle.getYearManufacture() == null || vehicle.getYearManufacture() <= 0) {
            missingFields.append("year_manufacture, ");
        }
        if (vehicle.getTransmission() == null) {
            missingFields.append("transmission, ");
        }
        if (vehicle.getFuelType() == null) {
            missingFields.append("fuel_type, ");
        }
        if (vehicle.getInsuranceStatus() == null) {
            missingFields.append("insurance_status, ");
        }
        if (vehicle.getShipToAddress() == null) {
            missingFields.append("ship_to_address, ");
        }
    }

    private void validateBicycleRequirements(Vehicle vehicle, StringBuilder missingFields) {
        if (vehicle.getYearManufacture() == null || vehicle.getYearManufacture() <= 0) {
            missingFields.append("year_manufacture, ");
        }

        if (vehicle.getInsuranceStatus() == null) {
            missingFields.append("insurance_status, ");
        }
        if (vehicle.getShipToAddress() == null) {
            missingFields.append("ship_to_address, ");
        }
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
    private Vehicle.HaveDriver parseHaveDriver(String hasDriver) {
        if (hasDriver == null || hasDriver.trim().isEmpty()) {
            return null;
        }
        try{
            return Vehicle.HaveDriver.valueOf(hasDriver.toUpperCase());
        }catch (IllegalArgumentException e){
            log.warn("Invalid has driver: {}, defaulting to NO", hasDriver);
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
    private void setTimestamps(Vehicle vehicle, LocalDateTime createdAt, LocalDateTime updatedAt) {
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
                vehicle.getClass().getMethod("setCreatedAt", LocalDateTime.class).invoke(vehicle, createdAt);
                vehicle.getClass().getMethod("setUpdatedAt", LocalDateTime.class).invoke(vehicle, updatedAt);
            } catch (Exception ex) {
                log.error("Failed to set timestamps using setter methods", ex);
            }
        }
    }

    private void setUpdatedAt(Vehicle vehicle, LocalDateTime updatedAt) {
        try {
            Field updatedAtField = Vehicle.class.getDeclaredField("updatedAt");
            updatedAtField.setAccessible(true);
            updatedAtField.set(vehicle, updatedAt);

            log.debug("Set updatedAt for vehicle: {}", updatedAt);
        } catch (Exception e) {
            log.error("Failed to set updatedAt using reflection", e);
            // Fallback: try direct setter method if it exists
            try {
                vehicle.getClass().getMethod("setUpdatedAt", LocalDateTime.class).invoke(vehicle, updatedAt);
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