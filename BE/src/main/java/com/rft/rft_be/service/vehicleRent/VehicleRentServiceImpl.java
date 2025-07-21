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
        String licensePlate = null; // Khởi tạo là null

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

        // Sắp xếp nếu cần
//        if (sortBy != null && !sortBy.isEmpty()) {
//            carListAll.sort((v1, v2) -> {
//                try {
//                    Object field1 = Vehicle.class.getDeclaredField(sortBy).get(v1);
//                    Object field2 = Vehicle.class.getDeclaredField(sortBy).get(v2);
//                    if (field1 instanceof Comparable && field2 instanceof Comparable) {
//                        int cmp = ((Comparable) field1).compareTo(field2);
//                        return "desc".equalsIgnoreCase(sortDir) ? -cmp : cmp;
//                    }
//                } catch (Exception ignored) {}
//                return 0;
//            });
//        }

        int totalElements = carListAll.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<VehicleThumbGroupDTO> pagedContent = carListAll.subList(fromIndex, toIndex)
                .stream()
                .map(vehicle -> VehicleThumbGroupDTO.builder()
                        .thumb(vehicle.getThumb())
                        .vehicle(List.of(vehicleMapper.vehicleToVehicleDetail(vehicle)))
                        .vehicleNumber(1)
                        .build())
                .collect(Collectors.toList());

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
        Map<String, List<Vehicle>> grouped = motorbikes.stream()
                .collect(Collectors.groupingBy(v -> v.getThumb() != null ? v.getThumb() : "Khác"));
        List<VehicleThumbGroupDTO> groupList = grouped.entrySet().stream()
                .map(entry -> VehicleThumbGroupDTO.builder()
                        .thumb(entry.getKey())
                        .vehicle(entry.getValue().stream().map(vehicleMapper::vehicleToVehicleDetail).collect(Collectors.toList()))
                        .vehicleNumber(entry.getValue().size())
                        .build())
                .collect(Collectors.toList());

        // Optional: sort groupList by sortBy and sortDir if needed (currently not implemented)
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
        Map<String, List<Vehicle>> grouped = bicycles.stream()
                .collect(Collectors.groupingBy(v -> v.getThumb() != null ? v.getThumb() : "Khác"));
        List<VehicleThumbGroupDTO> groupList = grouped.entrySet().stream()
                .map(entry -> VehicleThumbGroupDTO.builder()
                        .thumb(entry.getKey())
                        .vehicle(entry.getValue().stream().map(vehicleMapper::vehicleToVehicleDetail).collect(Collectors.toList()))
                        .vehicleNumber(entry.getValue().size())
                        .build())
                .collect(Collectors.toList());

        // Optional: sort groupList by sortBy and sortDir if needed (currently not implemented)
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
            log.info("[VehicleRent] Đã tìm thấy {} xe cùng thumb cho user {}. Tiến hành tăng số lượng và tạo xe mới.", sameThumbVehicles.size(), userId);
            // Nếu đã có xe cùng thumb: tăng số lượng cho tất cả xe cùng nhóm
            for (Vehicle v : sameThumbVehicles) {
                int oldNumber = v.getNumberVehicle() != null ? v.getNumberVehicle() : 1;
                v.setNumberVehicle(oldNumber + numberVehicle);
            }
            vehicleRepository.saveAll(sameThumbVehicles);
            log.info("[VehicleRent] Đã cập nhật số lượng xe cho tất cả xe cùng thumb.");

            // Tạo mới từng xe với biển số mới (nếu chưa tồn tại)
            Vehicle vehicleToCopy = sameThumbVehicles.get(0);
            int loopCount = isBicycle ? numberVehicle : licensePlates.size();
            for (int i = 0; i < loopCount; i++) {
                String plate = isBicycle ? null : licensePlates.get(i);
                if (vehicleRepository.existsByLicensePlateAndUserId(plate, userId) && !isBicycle) {
                    log.error("[VehicleRent] Biển số xe đã tồn tại: {}", plate);
                    throw new RuntimeException("Biển số xe đã tồn tại: " + plate);
                }
                log.info("[VehicleRent] Tạo mới xe với biển số: {} cho user: {}", plate, userId);
                Vehicle.VehicleBuilder builder = Vehicle.builder()
                        .user(vehicleToCopy.getUser())
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
                        .totalRatings(0);
                if (isMotorbike) {
                    builder.brand(vehicleToCopy.getBrand());
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
                log.info("[VehicleRent] Đã lưu xe mới với biển số: {} thành công.", plate);
                createdVehicles.add(vehicleMapper.vehicleGet(savedVehicle));
            }
            // Trả về xe vừa tạo cuối cùng
            log.info("[VehicleRent] Hoàn thành tạo/cập nhật {} xe với thumb: {} cho user: {} (trùng thumb)", createdVehicles.size(), request.getThumb(), userId);
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
                        .status(Vehicle.Status.AVAILABLE)
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