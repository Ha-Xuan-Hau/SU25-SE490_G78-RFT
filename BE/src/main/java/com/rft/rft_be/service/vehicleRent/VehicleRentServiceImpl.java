package com.rft.rft_be.service.vehicleRent;

import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.dto.vehicle.vehicleRent.*;
import com.rft.rft_be.entity.*;
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

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

    @Override
    public PageResponseDTO<VehicleDTO> getUserVehicles( int page, int size, String sortBy, String sortDir) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Getting vehicles for user: {}, page: {}, size: {}", userId, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

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
        String licensePlate = null; // Khởi tạo là null

        if (vehicleType == Vehicle.VehicleType.CAR) {
            // Car: require brand, model and license plate
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Car must have a valid brand. Not found: " + request.getBrandId()));
            model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new RuntimeException("Vehicle must have a valid model. Not found: " + request.getModelId()));

            // Validate license plate for CAR
            if (request.getLicensePlate() == null || request.getLicensePlate().trim().isEmpty()) {
                throw new RuntimeException("Vehicle must have a license plate");
            }
            licensePlate = request.getLicensePlate().trim();

        } else if (vehicleType == Vehicle.VehicleType.MOTORBIKE) {
            // Motorbike: require brand and license plate only
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Vehicle must have a valid brand. Not found: " + request.getBrandId()));

            // Validate license plate for MOTORBIKE
            if (request.getLicensePlate() == null || request.getLicensePlate().trim().isEmpty()) {
                throw new RuntimeException("Vehicle must have a license plate");
            }
            licensePlate = request.getLicensePlate().trim();

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
                .vehicleImages(request.getVehicleImages())
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
                .status(Vehicle.Status.AVAILABLE)
                .totalRatings(0)
                .likes(0)
                .build();

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

        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found or you don't have permission to update it"));

        ExtraFeeRule extraFeeRule = extraFeeRuleRepository.findByVehicleId(vehicleId);

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

        // Manually set updatedAt timestamp using reflection
        LocalDateTime now = LocalDateTime.now();
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

        return vehicleMapper.vehicleToVehicleDetail(vehicle);
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
    public List<VehicleThumbGroupDTO> getProviderMotorbikeAndBicycleGroupedByThumb() {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        List<Vehicle> motorbikes = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.MOTORBIKE);
        List<Vehicle> bicycles = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.BICYCLE);

        List<Vehicle> all = new ArrayList<>();
        all.addAll(motorbikes);
        all.addAll(bicycles);

        // Gom nhóm theo thumb
        Map<String, List<Vehicle>> grouped = all.stream()
                .collect(Collectors.groupingBy(v -> v.getThumb() != null ? v.getThumb() : "Khác"));

        // Map sang DTO
        List<VehicleThumbGroupDTO> result = grouped.entrySet().stream()
                .map(entry -> VehicleThumbGroupDTO.builder()
                        .thumb(entry.getKey())
                        .vehicle(entry.getValue().stream().map(vehicleMapper::vehicleToVehicleDetail).collect(Collectors.toList()))
                        .vehicleNumber(entry.getValue().size())
                        .build())
                .collect(Collectors.toList());
        return result;
    }

    @Override
    public List<VehicleThumbGroupDTO> getProviderMotorbikeGroupedByThumb() {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        List<Vehicle> motorbikes = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.MOTORBIKE);
        Map<String, List<Vehicle>> grouped = motorbikes.stream()
                .collect(Collectors.groupingBy(v -> v.getThumb() != null ? v.getThumb() : "Khác"));
        return grouped.entrySet().stream()
                .map(entry -> VehicleThumbGroupDTO.builder()
                        .thumb(entry.getKey())
                        .vehicle(entry.getValue().stream().map(vehicleMapper::vehicleToVehicleDetail).collect(Collectors.toList()))
                        .vehicleNumber(entry.getValue().size())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleThumbGroupDTO> getProviderBicycleGroupedByThumb() {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        List<Vehicle> bicycles = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.BICYCLE);
        Map<String, List<Vehicle>> grouped = bicycles.stream()
                .collect(Collectors.groupingBy(v -> v.getThumb() != null ? v.getThumb() : "Khác"));
        return grouped.entrySet().stream()
                .map(entry -> VehicleThumbGroupDTO.builder()
                        .thumb(entry.getKey())
                        .vehicle(entry.getValue().stream().map(vehicleMapper::vehicleToVehicleDetail).collect(Collectors.toList()))
                        .vehicleNumber(entry.getValue().size())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public VehicleGetDTO createOrUpdateVehicleWithNumberVehicle(VehicleRentCreateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        // Tìm các xe cùng thumb và user
        List<Vehicle> sameThumbVehicles = vehicleRepository.findByUserId(userId).stream()
                .filter(v -> request.getThumb() != null && request.getThumb().equals(v.getThumb()))
                .collect(Collectors.toList());

        Vehicle vehicleToCopy = sameThumbVehicles.isEmpty() ? null : sameThumbVehicles.get(0);
        Vehicle savedVehicle;
        if (vehicleToCopy != null) {
            // Đã có xe cùng thumb và user: tăng number_vehicle cho tất cả xe cùng nhóm
            sameThumbVehicles.forEach(v -> v.setNumberVehicle((v.getNumberVehicle() == null ? 1 : v.getNumberVehicle()) + 1));
            vehicleRepository.saveAll(sameThumbVehicles);

            // Tạo mới 1 xe với các trường riêng biệt, các trường chung lấy từ vehicleToCopy
            Vehicle newVehicle = Vehicle.builder()
                    .user(vehicleToCopy.getUser())
                    .brand(vehicleToCopy.getBrand())
                    .model(vehicleToCopy.getModel())
                    .penalty(vehicleToCopy.getPenalty())
                    .vehicleType(vehicleToCopy.getVehicleType())
                    .vehicleFeatures(vehicleToCopy.getVehicleFeatures())
                    .insuranceStatus(vehicleToCopy.getInsuranceStatus())
                    .shipToAddress(vehicleToCopy.getShipToAddress())
                    .numberSeat(vehicleToCopy.getNumberSeat())
                    .yearManufacture(vehicleToCopy.getYearManufacture())
                    .transmission(vehicleToCopy.getTransmission())
                    .fuelType(vehicleToCopy.getFuelType())
                    .description(vehicleToCopy.getDescription())
                    .costPerDay(vehicleToCopy.getCostPerDay())
                    .status(Vehicle.Status.AVAILABLE)
                    .thumb(vehicleToCopy.getThumb())
                    .numberVehicle(vehicleToCopy.getNumberVehicle())
                    .likes(0)
                    .totalRatings(0)
                    // Các trường riêng biệt lấy từ request
                    .licensePlate(request.getLicensePlate())
                    .vehicleImages(request.getVehicleImages())
                    .build();
            setTimestamps(newVehicle, LocalDateTime.now(), LocalDateTime.now());
            savedVehicle = vehicleRepository.save(newVehicle);
        } else {
            // Chưa có xe cùng thumb và user: tạo mới như bình thường
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            Vehicle.VehicleType vehicleType = parseVehicleType(request.getVehicleType());
            Vehicle newVehicle = Vehicle.builder()
                    .user(user)
                    .brand(request.getBrandId() != null ? brandRepository.findById(request.getBrandId()).orElse(null) : null)
                    .model(request.getModelId() != null ? modelRepository.findById(request.getModelId()).orElse(null) : null)
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
                    .status(Vehicle.Status.AVAILABLE)
                    .thumb(request.getThumb())
                    .numberVehicle(1)
                    .likes(0)
                    .totalRatings(0)
                    .licensePlate(request.getLicensePlate())
                    .vehicleImages(request.getVehicleImages())
                    .build();
            setTimestamps(newVehicle, LocalDateTime.now(), LocalDateTime.now());
            savedVehicle = vehicleRepository.save(newVehicle);
        }
        // Check trùng biển số cho user này
        if (request.getLicensePlate() != null && vehicleRepository.existsByLicensePlateAndUserId(request.getLicensePlate(), userId)) {
            throw new RuntimeException("Biển số xe đã tồn tại");
        }
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(savedVehicle.getId())
                .orElse(savedVehicle);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    public VehicleGetDTO updateCommonVehicleInfo(String vehicleId, VehicleRentUpdateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + vehicleId));
        String thumb = vehicle.getThumb();
        // Lấy tất cả xe cùng thumb và user
        List<Vehicle> sameThumbVehicles = vehicleRepository.findByUserId(userId).stream()
                .filter(v -> thumb != null && thumb.equals(v.getThumb()))
                .collect(Collectors.toList());
        for (Vehicle v : sameThumbVehicles) {
            // Cập nhật các trường chung (trừ id, vehicle_images, license_plate, total_ratings)
            if (request.getBrandId() != null) v.setBrand(brandRepository.findById(request.getBrandId()).orElse(null));
            if (request.getModelId() != null) v.setModel(modelRepository.findById(request.getModelId()).orElse(null));
            // Bỏ cập nhật penalty và likes vì DTO không có trường này
            if (request.getVehicleType() != null) v.setVehicleType(parseVehicleType(request.getVehicleType()));
            if (request.getVehicleFeatures() != null) v.setVehicleFeatures(request.getVehicleFeatures());
            if (request.getInsuranceStatus() != null) v.setInsuranceStatus(parseInsuranceStatus(request.getInsuranceStatus()));
            if (request.getShipToAddress() != null) v.setShipToAddress(parseShipToAddress(request.getShipToAddress()));
            if (request.getNumberSeat() != null) v.setNumberSeat(request.getNumberSeat());
            if (request.getYearManufacture() != null) v.setYearManufacture(request.getYearManufacture());
            if (request.getTransmission() != null) v.setTransmission(parseTransmission(request.getTransmission()));
            if (request.getFuelType() != null) v.setFuelType(parseFuelType(request.getFuelType()));
            if (request.getDescription() != null) v.setDescription(request.getDescription());
            if (request.getCostPerDay() != null) v.setCostPerDay(request.getCostPerDay());
            if (request.getStatus() != null) v.setStatus(parseStatus(request.getStatus()));
            if (request.getThumb() != null) v.setThumb(request.getThumb());
            if (request.getNumberVehicle() != null) v.setNumberVehicle(request.getNumberVehicle());
            setUpdatedAt(v, LocalDateTime.now());
        }
        vehicleRepository.saveAll(sameThumbVehicles);
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(vehicleId)
                .orElse(vehicle);
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
        if (request.getVehicleImages() != null) vehicle.setVehicleImages(request.getVehicleImages());
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