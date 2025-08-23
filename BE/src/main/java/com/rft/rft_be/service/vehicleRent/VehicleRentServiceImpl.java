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
    private final BookingRepository bookingRepository;
    private final ContractRepository contractRepository;


    private final ExtraFeeRuleRepository extraFeeRuleRepository;
    private final ExtraFeeRuleMapper extraFeeRuleMapper;
    private final UserRegisterVehicleRepository userRegisterVehicleRepository;
    private final FinalContractRepository finalContractRepository;

    @Override
    public PageResponseDTO<VehicleGetDTO> getProviderCar(int page, int size, String sortBy, String sortDir) {

        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Lấy xe cho người dùng: {}, trang: {}, kích thước: {}", userId, page, size);

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
    public VehicleGetDTO createVehicle(VehicleRentCreateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));

        Vehicle.VehicleType vehicleType;
        try {
            vehicleType = Vehicle.VehicleType.valueOf(request.getVehicleType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Loại xe không hợp lệ: " + request.getVehicleType() + ". Giá trị hợp lệ: CAR, MOTORBIKE, BICYCLE");
        }

        // Validate brand and model based on vehicle type
        Brand brand = null;
        Model model = null;

        List<String> licensePlates = request.getLicensePlate();

        String licensePlate = licensePlates.get(0); // Khởi tạo là null

        if (vehicleType == Vehicle.VehicleType.CAR) {
            // Car: require brand, model and license plate
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Xe hơi phải có hãng. Không tìm thấy: " + request.getBrandId()));
            model = modelRepository.findById(request.getModelId())
                    .orElseThrow(() -> new RuntimeException("Xe phải có mô hình hợp lệ. Không tìm thấy: " + request.getModelId()));

            // Validate license plate for CAR
            if (request.getLicensePlate() == null || request.getLicensePlate().isEmpty()) {
                throw new RuntimeException("Xe phải có biển số");
            }
            // Không gán licensePlate = request.getLicensePlate(); vì kiểu List<String>

        } else if (vehicleType == Vehicle.VehicleType.MOTORBIKE) {
            // Motorbike: require brand and license plate only
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Xe phải có hãng hợp lệ. Không tìm thấy: " + request.getBrandId()));

            // Validate license plate for MOTORBIKE
            if (request.getLicensePlate() == null || request.getLicensePlate().isEmpty()) {
                throw new RuntimeException("Xe phải có biển số");
            }
            // Không gán licensePlate = request.getLicensePlate(); vì kiểu List<String>

        } else if (vehicleType == Vehicle.VehicleType.BICYCLE) {
            // Bicycle: không cần brand, model, và license plate
            // licensePlate sẽ giữ nguyên là null
        }

        // Check if license plate already exists for this user (chỉ khi có license plate)
        if (licensePlate != null && vehicleRepository.existsByLicensePlateAndUserId(licensePlate, userId)) {
            throw new RuntimeException("Biển số đã tồn tại cho người dùng này");
        }
        Penalty penalty = null;
        if (request.getPenaltyId() != null && !request.getPenaltyId().trim().isEmpty()) {
            penalty = penaltyRepository.findById(request.getPenaltyId())
                    .orElseThrow(() -> new RuntimeException("Phạt không tồn tại với id: " + request.getPenaltyId()));
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

        // Tạo ExtraFeeRule chỉ cho xe ô tô
        if (vehicleType == Vehicle.VehicleType.CAR) {
            ExtraFeeRule extraFeeRule = new ExtraFeeRule().builder()
                    .vehicle(savedVehicle)
                    .maxKmPerDay(request.getMaxKmPerDay())
                    .feePerExtraKm(request.getFeePerExtraKm())
                    .allowedHourLate(request.getAllowedHourLate())
                    .feePerExtraHour(request.getFeePerExtraHour())
                    .cleaningFee(request.getCleaningFee())
                    .smellRemovalFee(request.getSmellRemovalFee())
                    .applyBatteryChargeFee(request.getApplyBatteryChargeFee())
                    .batteryChargeFeePerPercent(request.getBatteryChargeFeePerPercent())
                    .driverFeePerDay(request.getDriverFeePerDay())
                    .hasDriverOption(request.getHasDriverOption())
                    .driverFeePerHour(request.getDriverFeePerHour())
                    .hasHourlyRental(request.getHasHourlyRental())
                    .build();

            extraFeeRuleRepository.save(extraFeeRule);
            log.info("[DEBUG] Tạo ExtraFeeRule cho xe ô tô: {}", savedVehicle.getId());
        } else {
            log.info("[DEBUG] Bỏ qua tạo ExtraFeeRule cho xe {} (loại: {}). ExtraFeeRule chỉ áp dụng cho xe ô tô.",
                    savedVehicle.getId(), vehicleType);
        }

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(savedVehicle.getId())
                .orElse(savedVehicle);

        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    @Transactional
    public VehicleGetDTO updateVehicle(String vehicleId, VehicleRentUpdateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Cập nhật xe: {} cho người dùng: {}", vehicleId, userId);

        Vehicle existingVehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền cập nhật nó"));

        ExtraFeeRule extraFeeRule = extraFeeRuleRepository.findByVehicleId(vehicleId);

        boolean needApproval = false;
        boolean isChanged = false;
        // Brand
        if (request.getBrandId() != null) {
            String oldBrandId = existingVehicle.getBrand() != null ? existingVehicle.getBrand().getId() : null;
            if (!Objects.equals(oldBrandId, request.getBrandId())) {
                log.info("[DEBUG] Thay đổi hãng xe từ {} sang {}", oldBrandId, request.getBrandId());
                existingVehicle.setBrand(brandRepository.findById(request.getBrandId()).orElse(null));
                needApproval = true;
                isChanged = true;
            }
        }
        // Model
        if (request.getModelId() != null) {
            String oldModelId = existingVehicle.getModel() != null ? existingVehicle.getModel().getId() : null;
            if (!Objects.equals(oldModelId, request.getModelId())) {
                log.info("[DEBUG] Thay đổi mô hình xe từ {} sang {}", oldModelId, request.getModelId());
                existingVehicle.setModel(modelRepository.findById(request.getModelId()).orElse(null));
                needApproval = true;
                isChanged = true;
            }
        }
        // License plate
        if (request.getLicensePlate() != null && !request.getLicensePlate().isEmpty()) {
            String oldPlate = existingVehicle.getLicensePlate() == null ? "" : existingVehicle.getLicensePlate();
            String newPlate = request.getLicensePlate();
            if (!oldPlate.equals(newPlate)) {
                log.info("[DEBUG] Thay đổi biển số xe từ '{}' sang '{}'", oldPlate, newPlate);
                // Check duplicate
                if (existingVehicle.getLicensePlate() != null &&
                        !existingVehicle.getLicensePlate().equals(request.getLicensePlate())) {
                    boolean exists = vehicleRepository.existsByLicensePlate(request.getLicensePlate());
                    if (exists) {
                        throw new RuntimeException("Xe với biển số " + request.getLicensePlate() + " đã tồn tại");
                    }
                } else if (existingVehicle.getLicensePlate() == null &&
                        request.getLicensePlate() != null) {
                    boolean exists = vehicleRepository.existsByLicensePlate(request.getLicensePlate());
                    if (exists) {
                        throw new RuntimeException("Xe với biển số " + request.getLicensePlate() + " đã tồn tại");
                    }
                }
                existingVehicle.setLicensePlate(request.getLicensePlate());
                needApproval = true;
                isChanged = true;
            }
        }
        // Number seat
        if (request.getNumberSeat() != null) {
            Integer oldSeat = existingVehicle.getNumberSeat();
            Integer newSeat = request.getNumberSeat();
            if (!Objects.equals(oldSeat, newSeat)) {
                log.info("[DEBUG] Thay đổi số ghế từ {} sang {}", oldSeat, newSeat);
                existingVehicle.setNumberSeat(newSeat);
                needApproval = true;
                isChanged = true;
            }
        }
        // Insurance status
        if (request.getInsuranceStatus() != null && !request.getInsuranceStatus().trim().isEmpty()) {
            Vehicle.InsuranceStatus oldStatus = existingVehicle.getInsuranceStatus();
            Vehicle.InsuranceStatus newStatus = null;
            try {
                newStatus = Vehicle.InsuranceStatus.valueOf(request.getInsuranceStatus().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldStatus, newStatus)) {
                log.info("[DEBUG] Thay đổi trạng thái bảo hiểm từ {} sang {}", oldStatus, newStatus);
                existingVehicle.setInsuranceStatus(newStatus);
                needApproval = true;
                isChanged = true;
            }
        }
        // Transmission
        if (request.getTransmission() != null && !request.getTransmission().trim().isEmpty()) {
            Vehicle.Transmission oldTrans = existingVehicle.getTransmission();
            Vehicle.Transmission newTrans = null;
            try {
                newTrans = Vehicle.Transmission.valueOf(request.getTransmission().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldTrans, newTrans)) {
                log.info("[DEBUG] Thay đổi hộp số từ {} sang {}", oldTrans, newTrans);
                existingVehicle.setTransmission(newTrans);
                needApproval = true;
                isChanged = true;
            }
        }
        // Fuel type
        if (request.getFuelType() != null && !request.getFuelType().trim().isEmpty()) {
            Vehicle.FuelType oldFuel = existingVehicle.getFuelType();
            Vehicle.FuelType newFuel = null;
            try {
                newFuel = Vehicle.FuelType.valueOf(request.getFuelType().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldFuel, newFuel)) {
                log.info("[DEBUG] Thay đổi loại nhiên liệu từ {} sang {}", oldFuel, newFuel);
                existingVehicle.setFuelType(newFuel);
                needApproval = true;
                isChanged = true;
            }
        }
        // Vehicle type
        if (request.getVehicleType() != null && !request.getVehicleType().trim().isEmpty()) {
            Vehicle.VehicleType oldType = existingVehicle.getVehicleType();
            Vehicle.VehicleType newType = null;
            try {
                newType = Vehicle.VehicleType.valueOf(request.getVehicleType().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldType, newType)) {
                log.info("[DEBUG] Thay đổi loại xe từ {} sang {}", oldType, newType);
                existingVehicle.setVehicleType(newType);
                needApproval = true;
                isChanged = true;
            }
        }
        // Vehicle images
        if (request.getVehicleImages() != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                String oldImages = existingVehicle.getVehicleImages();
                String newImages = mapper.writeValueAsString(request.getVehicleImages().stream().map(VehicleImageDTO::getImageUrl).collect(Collectors.toList()));
                if (oldImages == null) oldImages = "[]";
                if (newImages == null) newImages = "[]";
                if (!oldImages.equals(newImages)) {
                    log.info("[DEBUG] Thay đổi ảnh xe từ '{}' sang '{}'", oldImages, newImages);
                    existingVehicle.setVehicleImages(newImages);
                    needApproval = true;
                    isChanged = true;
                }
            } catch (Exception e) {
                log.error("[DEBUG] Lỗi xử lý ảnh xe", e);
            }
        }
        // Have driver
        if (request.getHaveDriver() != null && !request.getHaveDriver().trim().isEmpty()) {
            Vehicle.HaveDriver oldDriver = existingVehicle.getHaveDriver();
            Vehicle.HaveDriver newDriver = null;
            try {
                newDriver = Vehicle.HaveDriver.valueOf(request.getHaveDriver().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldDriver, newDriver)) {
                log.info("[DEBUG] Thay đổi có tài xế từ {} sang {}", oldDriver, newDriver);
                existingVehicle.setHaveDriver(newDriver);
                isChanged = true;
            }
        }
        // Ship to address
        if (request.getShipToAddress() != null && !request.getShipToAddress().trim().isEmpty()) {
            Vehicle.ShipToAddress oldShip = existingVehicle.getShipToAddress();
            Vehicle.ShipToAddress newShip = null;
            try {
                newShip = Vehicle.ShipToAddress.valueOf(request.getShipToAddress().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldShip, newShip)) {
                log.info("[DEBUG] Thay đổi địa chỉ giao xe từ {} sang {}", oldShip, newShip);
                existingVehicle.setShipToAddress(newShip);
                isChanged = true;
            }
        }
        // Status
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            Vehicle.Status oldStatus = existingVehicle.getStatus();
            Vehicle.Status newStatus = null;
            try {
                newStatus = Vehicle.Status.valueOf(request.getStatus().toUpperCase());
            } catch (Exception ignored) {
            }
            if (!Objects.equals(oldStatus, newStatus)) {
                log.info("[DEBUG] Thay đổi trạng thái từ {} sang {}", oldStatus, newStatus);
                existingVehicle.setStatus(newStatus);
                isChanged = true;
            }
        }
        // Các trường còn lại chỉ update nếu khác, không ảnh hưởng trạng thái
        if (request.getDescription() != null) {
            String oldDesc = existingVehicle.getDescription() == null ? "" : existingVehicle.getDescription();
            String newDesc = request.getDescription() == null ? "" : request.getDescription();
            if (!oldDesc.equals(newDesc)) {
                log.info("[DEBUG] Thay đổi mô tả từ '{}' sang '{}'", oldDesc, newDesc);
                existingVehicle.setDescription(request.getDescription());
                isChanged = true;
            }
        }

        if (request.getYearManufacture() != null) {
            if (!Objects.equals(existingVehicle.getYearManufacture(), request.getYearManufacture())) {
                log.info("[DEBUG] Thay đổi năm sản xuất từ {} sang {}", existingVehicle.getYearManufacture(), request.getYearManufacture());
                existingVehicle.setYearManufacture(request.getYearManufacture());
                isChanged = true;

            }
        }
        if (request.getNumberVehicle() != null) {
            if (!Objects.equals(existingVehicle.getNumberVehicle(), request.getNumberVehicle())) {
                log.info("[DEBUG] Thay đổi số lượng xe từ {} sang {}", existingVehicle.getNumberVehicle(), request.getNumberVehicle());
                existingVehicle.setNumberVehicle(request.getNumberVehicle());
                isChanged = true;
            }
        }

        // Update cost per day
        if (request.getCostPerDay() != null) {
            if (!Objects.equals(existingVehicle.getCostPerDay(), request.getCostPerDay())) {
                log.info("[DEBUG] Thay đổi giá thuê từ {} sang {}", existingVehicle.getCostPerDay(), request.getCostPerDay());
                existingVehicle.setCostPerDay(request.getCostPerDay());
                isChanged = true;
            }
        }

        // Update vehicle features
        if (request.getVehicleFeatures() != null) {
            if (!Objects.equals(existingVehicle.getVehicleFeatures(), request.getVehicleFeatures())) {
                log.info("[DEBUG] Thay đổi tính năng xe từ {} sang {}", existingVehicle.getVehicleFeatures(), request.getVehicleFeatures());
                existingVehicle.setVehicleFeatures(request.getVehicleFeatures());
                isChanged = true;
            }
        }

        // Update thumb
        if (request.getThumb() != null) {
            if (!Objects.equals(existingVehicle.getThumb(), request.getThumb())) {
                log.info("[DEBUG] Thay đổi thumb từ {} sang {}", existingVehicle.getThumb(), request.getThumb());
                existingVehicle.setThumb(request.getThumb());
                isChanged = true;
            }
        }

        if (request.getPenaltyId() != null && !request.getPenaltyId().trim().isEmpty()) {
            Penalty penalty = penaltyRepository.findById(request.getPenaltyId())

                    .orElseThrow(() -> new RuntimeException("Phạt không tồn tại với id: " + request.getPenaltyId()));
            existingVehicle.setPenalty(penalty);
        }

        // Update other fields if provided
        if (request.getHaveDriver() != null && !request.getHaveDriver().trim().isEmpty()) {
            try {
                existingVehicle.setHaveDriver(Vehicle.HaveDriver.valueOf(request.getHaveDriver().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Giá trị có tài xế không hợp lệ: " + request.getHaveDriver() + ". Giá trị hợp lệ: YES, NO");
            }
        }

        // Update insurance status - cần duyệt lại
        if (request.getInsuranceStatus() != null && !request.getInsuranceStatus().trim().isEmpty()) {
            try {
                Vehicle.InsuranceStatus newInsuranceStatus = Vehicle.InsuranceStatus.valueOf(request.getInsuranceStatus().toUpperCase());
                if (!Objects.equals(existingVehicle.getInsuranceStatus(), newInsuranceStatus)) {
                    log.info("[DEBUG] Thay đổi trạng thái bảo hiểm từ {} sang {}", existingVehicle.getInsuranceStatus(), newInsuranceStatus);
                    existingVehicle.setInsuranceStatus(newInsuranceStatus);
                    needApproval = true; // Bảo hiểm thay đổi cần duyệt lại
                }
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Trạng thái bảo hiểm không hợp lệ: " + request.getInsuranceStatus() + ". Giá trị hợp lệ: YES, NO");
            }
        }

        if (request.getShipToAddress() != null && !request.getShipToAddress().trim().isEmpty()) {
            try {
                existingVehicle.setShipToAddress(Vehicle.ShipToAddress.valueOf(request.getShipToAddress().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Địa chỉ giao xe không hợp lệ: " + request.getShipToAddress() + ". Giá trị hợp lệ: YES, NO");
            }
        }

        // Update transmission - cần duyệt lại
        if (request.getTransmission() != null && !request.getTransmission().trim().isEmpty()) {
            try {
                Vehicle.Transmission newTransmission = Vehicle.Transmission.valueOf(request.getTransmission().toUpperCase());
                if (!Objects.equals(existingVehicle.getTransmission(), newTransmission)) {
                    log.info("[DEBUG] Thay đổi hộp số từ {} sang {}", existingVehicle.getTransmission(), newTransmission);
                    existingVehicle.setTransmission(newTransmission);
                    needApproval = true; // Truyền động thay đổi cần duyệt lại
                }
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Hộp số không hợp lệ: " + request.getTransmission() + ". Giá trị hợp lệ: MANUAL, AUTOMATIC");
            }
        }

        // Update fuel type - cần duyệt lại
        if (request.getFuelType() != null && !request.getFuelType().trim().isEmpty()) {
            try {
                Vehicle.FuelType newFuelType = Vehicle.FuelType.valueOf(request.getFuelType().toUpperCase());
                if (!Objects.equals(existingVehicle.getFuelType(), newFuelType)) {
                    log.info("[DEBUG] Thay đổi loại nhiên liệu từ {} sang {}", existingVehicle.getFuelType(), newFuelType);
                    existingVehicle.setFuelType(newFuelType);
                    needApproval = true; // Nguyên liệu thay đổi cần duyệt lại
                }
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Loại nhiên liệu không hợp lệ: " + request.getFuelType() + ". Giá trị hợp lệ: GASOLINE, ELECTRIC");
            }
        }

        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                existingVehicle.setStatus(Vehicle.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Trạng thái không hợp lệ: " + request.getStatus() + ". Giá trị hợp lệ: AVAILABLE, UNAVAILABLE");
            }
        }

        // Update ExtraFeeRule if provided - CHỈ ÁP DỤNG CHO XE Ô TÔ
// Trong phần update ExtraFeeRule
        if (existingVehicle.getVehicleType() == Vehicle.VehicleType.CAR) {
            if (extraFeeRule != null) {
                boolean extraFeeRuleChanged = false;

                if (request.getMaxKmPerDay() != null && !Objects.equals(extraFeeRule.getMaxKmPerDay(), request.getMaxKmPerDay())) {
                    extraFeeRule.setMaxKmPerDay(request.getMaxKmPerDay());
                    extraFeeRuleChanged = true;
                }

                if (request.getFeePerExtraKm() != null && !Objects.equals(extraFeeRule.getFeePerExtraKm(), request.getFeePerExtraKm())) {
                    extraFeeRule.setFeePerExtraKm(request.getFeePerExtraKm());
                    extraFeeRuleChanged = true;
                }

                if (request.getAllowedHourLate() != null && !Objects.equals(extraFeeRule.getAllowedHourLate(), request.getAllowedHourLate())) {
                    extraFeeRule.setAllowedHourLate(request.getAllowedHourLate());
                    extraFeeRuleChanged = true;
                }

                if (request.getFeePerExtraHour() != null && !Objects.equals(extraFeeRule.getFeePerExtraHour(), request.getFeePerExtraHour())) {
                    extraFeeRule.setFeePerExtraHour(request.getFeePerExtraHour());
                    extraFeeRuleChanged = true;
                }

                if (request.getCleaningFee() != null && !Objects.equals(extraFeeRule.getCleaningFee(), request.getCleaningFee())) {
                    extraFeeRule.setCleaningFee(request.getCleaningFee());
                    extraFeeRuleChanged = true;
                }

                if (request.getSmellRemovalFee() != null && !Objects.equals(extraFeeRule.getSmellRemovalFee(), request.getSmellRemovalFee())) {
                    extraFeeRule.setSmellRemovalFee(request.getSmellRemovalFee());
                    extraFeeRuleChanged = true;
                }

                // XỬ LÝ applyBatteryChargeFee RIÊNG
                if (request.getApplyBatteryChargeFee() != null) {
                    Boolean currentValue = extraFeeRule.getApplyBatteryChargeFee();
                    Boolean newValue = request.getApplyBatteryChargeFee();

                    if (!Objects.equals(currentValue, newValue)) {
                        extraFeeRule.setApplyBatteryChargeFee(newValue);
                        extraFeeRuleChanged = true;
                        log.info("[DEBUG] Thay đổi applyBatteryChargeFee từ {} sang {}", currentValue, newValue);
                    }
                }

                // XỬ LÝ batteryChargeFeePerPercent
                if (request.getBatteryChargeFeePerPercent() != null &&
                        !Objects.equals(extraFeeRule.getBatteryChargeFeePerPercent(), request.getBatteryChargeFeePerPercent())) {
                    extraFeeRule.setBatteryChargeFeePerPercent(request.getBatteryChargeFeePerPercent());
                    extraFeeRuleChanged = true;
                }

                if (request.getDriverFeePerDay() != null && !Objects.equals(extraFeeRule.getDriverFeePerDay(), request.getDriverFeePerDay())) {
                    extraFeeRule.setDriverFeePerDay(request.getDriverFeePerDay());
                    extraFeeRuleChanged = true;
                }

                if (request.getHasDriverOption() != null && !Objects.equals(extraFeeRule.getHasDriverOption(), request.getHasDriverOption())) {
                    extraFeeRule.setHasDriverOption(request.getHasDriverOption());
                    extraFeeRuleChanged = true;
                }

                if (request.getDriverFeePerHour() != null && !Objects.equals(extraFeeRule.getDriverFeePerHour(), request.getDriverFeePerHour())) {
                    extraFeeRule.setDriverFeePerHour(request.getDriverFeePerHour());
                    extraFeeRuleChanged = true;
                }

                if (request.getHasHourlyRental() != null && !Objects.equals(extraFeeRule.getHasHourlyRental(), request.getHasHourlyRental())) {
                    extraFeeRule.setHasHourlyRental(request.getHasHourlyRental());
                    extraFeeRuleChanged = true;
                }

                // Save ExtraFeeRule if changed
                if (extraFeeRuleChanged) {
                    extraFeeRuleRepository.save(extraFeeRule);
                    log.info("[DEBUG] Cập nhật ExtraFeeRule cho xe ô tô: {}", vehicleId);
                }
            } else if (request.getMaxKmPerDay() != null || request.getFeePerExtraKm() != null ||
                    request.getAllowedHourLate() != null || request.getFeePerExtraHour() != null ||
                    request.getCleaningFee() != null || request.getSmellRemovalFee() != null ||
                    request.getBatteryChargeFeePerPercent() != null || request.getApplyBatteryChargeFee() != null ||
                    request.getDriverFeePerDay() != null || request.getHasDriverOption() != null ||
                    request.getDriverFeePerHour() != null || request.getHasHourlyRental() != null) {

                // Create new ExtraFeeRule
                ExtraFeeRule newExtraFeeRule = ExtraFeeRule.builder()
                        .vehicle(existingVehicle)
                        .maxKmPerDay(request.getMaxKmPerDay())
                        .feePerExtraKm(request.getFeePerExtraKm())
                        .allowedHourLate(request.getAllowedHourLate())
                        .feePerExtraHour(request.getFeePerExtraHour())
                        .cleaningFee(request.getCleaningFee())
                        .smellRemovalFee(request.getSmellRemovalFee())
                        .applyBatteryChargeFee(request.getApplyBatteryChargeFee()) // Sử dụng trực tiếp từ request
                        .batteryChargeFeePerPercent(request.getBatteryChargeFeePerPercent())
                        .driverFeePerDay(request.getDriverFeePerDay())
                        .hasDriverOption(request.getHasDriverOption())
                        .driverFeePerHour(request.getDriverFeePerHour())
                        .hasHourlyRental(request.getHasHourlyRental())
                        .build();

                extraFeeRuleRepository.save(newExtraFeeRule);
                log.info("[DEBUG] Tạo mới ExtraFeeRule cho xe ô tô: {}", vehicleId);
            }
        } else {
            // Với xe máy và xe đạp, bỏ qua các trường ExtraFeeRule
            if (request.getMaxKmPerDay() != null || request.getFeePerExtraKm() != null ||
                    request.getAllowedHourLate() != null || request.getFeePerExtraHour() != null ||
                    request.getCleaningFee() != null || request.getSmellRemovalFee() != null ||
                    request.getBatteryChargeFeePerPercent() != null || request.getDriverFeePerDay() != null ||
                    request.getHasDriverOption() != null || request.getDriverFeePerHour() != null ||
                    request.getHasHourlyRental() != null) {
                log.warn("[DEBUG] Bỏ qua cập nhật ExtraFeeRule cho xe {} (loại: {}). ExtraFeeRule chỉ áp dụng cho xe ô tô.",
                        vehicleId, existingVehicle.getVehicleType());
            }
        }

        // Chỉ chuyển trạng thái về PENDING nếu có trường cần duyệt lại thay đổi
        if (needApproval) {
            log.info("[DEBUG] Đặt trạng thái thành PENDING do các trường quan trọng thay đổi");
            existingVehicle.setStatus(Vehicle.Status.PENDING);
        }

        // Manually set updatedAt timestamp using reflection
        LocalDateTime now = LocalDateTime.now();
        setUpdatedAt(existingVehicle, now);

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

        // Fetch with brand and model for response
        Vehicle vehicleWithRelations = vehicleRepository.findByIdWithBrandAndModel(updatedVehicle.getId())
                .orElse(updatedVehicle);

        log.info("[DEBUG] Cập nhật xe thành công: {}", vehicleId);
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
    public VehicleDetailDTO getVehicleById(String vehicleId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Lấy xe: {} cho người dùng: {}", vehicleId, userId);

        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền xem nó"));
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
    public VehicleGetDTO toggleVehicleStatus(String vehicleId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền cập nhật xe"));

        // Không cho đổi trạng thái nếu có booking đang diễn ra hoặc trong tương lai
        if (bookingRepository.existsActiveOrFutureByVehicleId(vehicleId, LocalDateTime.now())) {
            throw new RuntimeException("Xe đang có booking hiện tại hoặc sắp tới, không thể đổi trạng thái");
        }

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

        log.info("[DEBUG] Đã chuyển đổi trạng thái xe thành công: {} -> {}", vehicleId, newStatus);
        return vehicleMapper.vehicleGet(vehicleWithRelations);
    }

    @Override
    @Transactional
    public VehicleGetDTO toggleVehicleSuspended(String vehicleId) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền cập nhật xe"));

        // Không cho đổi trạng thái nếu có booking đang diễn ra hoặc trong tương lai
        if (bookingRepository.existsActiveOrFutureByVehicleId(vehicleId, LocalDateTime.now())) {
            throw new RuntimeException("Xe đang có booking hiện tại hoặc sắp tới, không thể đổi trạng thái");
        }

        Vehicle.Status current = vehicle.getStatus();
        Vehicle.Status newStatus;
        if (current == Vehicle.Status.SUSPENDED) {
            validateVehicleForAvailability(vehicle);
            newStatus = Vehicle.Status.AVAILABLE;
        } else if (current == Vehicle.Status.AVAILABLE) {
            // treo xe
            newStatus = Vehicle.Status.SUSPENDED;
        } else {
            throw new RuntimeException("Chỉ có thể chuyển giữa AVAILABLE và SUSPENDED từ trạng thái hiện tại: " + current);
        }

        vehicle.setStatus(newStatus);
        setUpdatedAt(vehicle, LocalDateTime.now());
        Vehicle updated = vehicleRepository.save(vehicle);
        Vehicle withRelations = vehicleRepository.findByIdWithBrandAndModel(updated.getId()).orElse(updated);
        log.info("[DEBUG] Đổi trạng thái AVAILABLE<->SUSPENDED thành công: {} -> {}", vehicleId, newStatus);
        return vehicleMapper.vehicleGet(withRelations);
    }
    @Override
    @Transactional
    public List<VehicleGetDTO> toggleVehicleSuspendedBulk(List<String> vehicleIds) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        if (vehicleIds == null || vehicleIds.isEmpty()) {
            throw new RuntimeException("Danh sách xe trống");
        }

        LocalDateTime now = LocalDateTime.now();
        List<VehicleGetDTO> result = new ArrayList<>();

        for (String vehicleId : vehicleIds) {
            Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền cập nhật xe: " + vehicleId));

            // Không cho đổi trạng thái nếu có booking đang diễn ra hoặc trong tương lai
            if (bookingRepository.existsActiveOrFutureByVehicleId(vehicleId, now)) {
                throw new RuntimeException("Xe " + vehicleId + " đang có booking hiện tại hoặc sắp tới, không thể đổi trạng thái");
            }

            Vehicle.Status current = vehicle.getStatus();
            Vehicle.Status newStatus;
            if (current == Vehicle.Status.SUSPENDED) {
                validateVehicleForAvailability(vehicle);
                newStatus = Vehicle.Status.AVAILABLE;
            } else if (current == Vehicle.Status.AVAILABLE) {
                newStatus = Vehicle.Status.SUSPENDED;
            } else {
                throw new RuntimeException("Chỉ có thể chuyển giữa AVAILABLE và SUSPENDED từ trạng thái hiện tại: " + current);
            }

            vehicle.setStatus(newStatus);
            setUpdatedAt(vehicle, now);
            Vehicle updated = vehicleRepository.save(vehicle);
            Vehicle withRelations = vehicleRepository.findByIdWithBrandAndModel(updated.getId()).orElse(updated);
            result.add(vehicleMapper.vehicleGet(withRelations));
        }

        log.info("[DEBUG] Bulk đổi trạng thái AVAILABLE<->SUSPENDED thành công cho {} xe", result.size());
        return result;
    }

    @Override
    public PageResponseDTO<VehicleThumbGroupDTO> getProviderCarGrouped(int page, int size, String sortBy, String sortDir) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");

        List<Vehicle> carListAll = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.CAR)
                .stream()
                .filter(v -> v.getStatus() == Vehicle.Status.SUSPENDED
                        || v.getStatus() == Vehicle.Status.AVAILABLE
                        || v.getStatus() == Vehicle.Status.PENDING)
                .collect(Collectors.toList());

        // Ô tô không group theo thumb, mỗi xe là một nhóm riêng biệt
        List<VehicleThumbGroupDTO> groupList = carListAll.stream()
                .sorted((v1, v2) -> {
                    // Sắp xếp xe theo createdAt giảm dần (mới nhất lên đầu)
                    LocalDateTime createdAt1 = v1.getCreatedAt();
                    LocalDateTime createdAt2 = v2.getCreatedAt();
                    if (createdAt1 == null && createdAt2 == null) return 0;
                    if (createdAt1 == null) return 1;
                    if (createdAt2 == null) return -1;
                    return createdAt2.compareTo(createdAt1); // Giảm dần
                })
                .map(vehicle -> {
                    List<VehicleDetailDTO> vehicleList = new ArrayList<>();
                    vehicleList.add(vehicleMapper.vehicleToVehicleDetail(vehicle));

                    return VehicleThumbGroupDTO.builder()
                            .thumb(vehicle.getThumb() != null ? vehicle.getThumb() : "Khác")
                            .vehicle(vehicleList)
                            .vehicleNumber(1) // Mỗi ô tô là 1 nhóm riêng
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
        List<Vehicle> motorbikes = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.MOTORBIKE)
                .stream()
                .filter(v -> v.getStatus() == Vehicle.Status.SUSPENDED
                        || v.getStatus() == Vehicle.Status.AVAILABLE
                        || v.getStatus() == Vehicle.Status.PENDING)
                .collect(Collectors.toList());

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
        List<Vehicle> bicycles = vehicleRepository.findByUserIdAndVehicleType(userId, Vehicle.VehicleType.BICYCLE)
                .stream()
                .filter(v -> v.getStatus() == Vehicle.Status.SUSPENDED
                        || v.getStatus() == Vehicle.Status.AVAILABLE
                        || v.getStatus() == Vehicle.Status.PENDING)
                .collect(Collectors.toList());

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
            log.error("[DEBUG] Số lượng biển số không hợp lệ. Số lượng biển số: {}, số lượng xe: {}", licensePlates != null ? licensePlates.size() : 0, numberVehicle);
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
                    log.info("[DEBUG] Debug - ID xe: {}, Loại: {}, Hãng: {}, Mô hình: {}, Phạt: {}, Tính năng: {}, Bảo hiểm: {}, Giao xe: {}, Ghế: {}, Năm: {}, Truyền động: {}, Nhiên liệu: {}, Giá: {}, Tài xế: {}",
                            v.getId(), typeMatch, brandMatch, modelMatch, penaltyMatch, featuresMatch, insuranceMatch, shipMatch, seatMatch, yearMatch, transmissionMatch, fuelMatch, costMatch, driverMatch);
                }

                return allMatch;
            });

            if (hasMatchingVehicle) {
                log.info("[DEBUG] Thumb '{}' đã tồn tại với cùng tất cả thông tin (trừ biển số, ảnh xe và mô tả) cho người dùng {}. Cho phép tạo xe mới.", request.getThumb(), userId);
            } else {
                log.error("[DEBUG] Thumb '{}' đã tồn tại nhưng khác thông tin cho người dùng {}. Không cho phép tạo xe mới.", request.getThumb(), userId);

                // Log chi tiết để debug
                Vehicle existingVehicle = sameThumbVehicles.get(0);
                log.info("[DEBUG] Request values: vehicleType={}, brandId={}, modelId={}, penaltyId={}, features={}, insurance={}, ship={}, seat={}, year={}, transmission={}, fuel={}, cost={}, driver={}",
                        request.getVehicleType(), request.getBrandId(), request.getModelId(), request.getPenaltyId(),
                        request.getVehicleFeatures(), request.getInsuranceStatus(), request.getShipToAddress(),
                        request.getNumberSeat(), request.getYearManufacture(), request.getTransmission(),
                        request.getFuelType(), request.getCostPerDay(), request.getHaveDriver());

                log.info("[DEBUG] Existing vehicle values: vehicleType={}, brandId={}, modelId={}, penaltyId={}, features={}, insurance={}, ship={}, seat={}, year={}, transmission={}, fuel={}, cost={}, driver={}",
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
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));
            Vehicle.VehicleType vehicleType = parseVehicleType(request.getVehicleType());
            int loopCount = isBicycle ? numberVehicle : licensePlates.size();
            for (int i = 0; i < loopCount; i++) {
                String plate = isBicycle ? null : licensePlates.get(i);
                if (vehicleRepository.existsByLicensePlateAndUserId(plate, userId) && !isBicycle) {
                    log.error("[DEBUG] Biển số xe đã tồn tại: {}", plate);
                    throw new RuntimeException("Biển số xe đã tồn tại: " + plate);
                }
                log.info("[DEBUG] Tạo xe mới với biển số: {} cho người dùng: {}", plate, userId);
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
                log.info("[DEBUG] Đã lưu xe mới với biển số: {} thành công.", plate);
                createdVehicles.add(vehicleMapper.vehicleGet(savedVehicle));
            }
            log.info("[DEBUG] Hoàn thành tạo mới {} xe với thumb: {} cho người dùng: {} (khác thông tin cơ bản)", createdVehicles.size(), request.getThumb(), userId);
            return createdVehicles;

        } else {
            log.info("[DEBUG] Không tìm thấy xe cùng thumb cho người dùng {}. Tiến hành tạo mới {} xe.", userId, numberVehicle);
            // Nếu chưa có xe cùng thumb: tạo mới numberVehicle xe, mỗi xe 1 biển số
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));
            Vehicle.VehicleType vehicleType = parseVehicleType(request.getVehicleType());
            int loopCount = isBicycle ? numberVehicle : licensePlates.size();
            for (int i = 0; i < loopCount; i++) {
                String plate = isBicycle ? null : licensePlates.get(i);
                if (vehicleRepository.existsByLicensePlateAndUserId(plate, userId) && !isBicycle) {
                    log.error("[DEBUG] Biển số xe đã tồn tại: {}", plate);
                    throw new RuntimeException("Biển số xe đã tồn tại: " + plate);
                }
                log.info("[DEBUG] Tạo xe mới với biển số: {} cho người dùng: {}", plate, userId);
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
                log.info("[DEBUG] Đã lưu xe mới với biển số: {} thành công.", plate);
                createdVehicles.add(vehicleMapper.vehicleGet(savedVehicle));
            }
            log.info("[DEBUG] Hoàn thành tạo mới {} xe với thumb: {} cho người dùng: {} (khác thumb)", createdVehicles.size(), request.getThumb(), userId);
            return createdVehicles;
        }
    }

    @Override
    public VehicleGetDTO updateCommonVehicleInfo(String vehicleId, VehicleRentUpdateDTO request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe hoặc bạn không có quyền cập nhật nó"));

        // Cập nhật các trường chung
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Hãng không tồn tại với id: " + request.getBrandId()));
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe: " + vehicleId));
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
            log.warn("Trạng thái bảo hiểm không hợp lệ: {}, mặc định thành NO", status);
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
            log.warn("Địa chỉ giao xe không hợp lệ: {}, mặc định thành NO", address);
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
            log.warn("Hộp số không hợp lệ: {}, đặt thành null", transmission);
            return null;
        }
    }

    private Vehicle.HaveDriver parseHaveDriver(String hasDriver) {
        if (hasDriver == null || hasDriver.trim().isEmpty()) {
            return null;
        }
        try {
            return Vehicle.HaveDriver.valueOf(hasDriver.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Giá trị có tài xế không hợp lệ: {}, mặc định thành NO", hasDriver);
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
            log.warn("Loại nhiên liệu không hợp lệ: {}, đặt thành null", fuelType);
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
            log.warn("Trạng thái không hợp lệ: {}, mặc định thành AVAILABLE", status);
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

            log.debug("Đặt thời gian cho xe: createdAt={}, updatedAt={}", createdAt, updatedAt);
        } catch (Exception e) {
            log.error("Không thể đặt thời gian sử dụng phương thức phản chiếu", e);
            // Fallback: try direct setter methods if they exist
            try {
                vehicle.getClass().getMethod("setCreatedAt", LocalDateTime.class).invoke(vehicle, createdAt);
                vehicle.getClass().getMethod("setUpdatedAt", LocalDateTime.class).invoke(vehicle, updatedAt);
            } catch (Exception ex) {
                log.error("Không thể đặt thời gian sử dụng phương thức setter", ex);
            }
        }
    }

    private void setUpdatedAt(Vehicle vehicle, LocalDateTime updatedAt) {
        try {
            Field updatedAtField = Vehicle.class.getDeclaredField("updatedAt");
            updatedAtField.setAccessible(true);
            updatedAtField.set(vehicle, updatedAt);

            log.debug("Đặt updatedAt cho xe: {}", updatedAt);
        } catch (Exception e) {
            log.error("Không thể đặt updatedAt sử dụng phương thức phản chiếu", e);
            // Fallback: try direct setter method if it exists
            try {
                vehicle.getClass().getMethod("setUpdatedAt", LocalDateTime.class).invoke(vehicle, updatedAt);
            } catch (Exception ex) {
                log.error("Không thể đặt updatedAt sử dụng phương thức setter", ex);
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
            log.warn("Loại xe không hợp lệ: {}, đặt thành null", type);
            return null;
        }
    }

    @Override
    public ProviderStatisticsDTO getProviderStatistics() {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        log.info("Lấy thống kê cho provider: {}", userId);

        // 1. Lấy thông tin provider
        User provider = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy provider với id: " + userId));

        // 2. Lấy các dịch vụ đã đăng ký
        List<String> registeredServices = userRegisterVehicleRepository.findByUserId(userId)
                .stream()
                .map(UserRegisterVehicle::getVehicleType)
                .collect(Collectors.toList());

        // 3. Đếm tổng số xe và thống kê theo loại xe
        Long totalVehicles = vehicleRepository.countByUserId(userId);
        
        // Lấy thống kê xe theo loại cho provider này
        List<Object[]> vehicleTypeCounts = vehicleRepository.countByVehicleTypeAndProviderId(userId);
        
        // Xử lý dữ liệu thống kê xe theo loại
        Long totalCars = 0L, totalMotorbikes = 0L, totalBicycles = 0L;
        for (Object[] result : vehicleTypeCounts) {
            Vehicle.VehicleType vehicleType = (Vehicle.VehicleType) result[0];
            Long count = (Long) result[1];
            
            switch (vehicleType) {
                case CAR -> totalCars = count;
                case MOTORBIKE -> totalMotorbikes = count;
                case BICYCLE -> totalBicycles = count;
            }
        }

        // 4. Lấy thống kê contract theo trạng thái trong tháng hiện tại (1 lần gọi)
        List<Object[]> contractStatusCounts = contractRepository.countByProviderIdAndStatusGroupInCurrentMonth(userId);
        
        // Xử lý dữ liệu contract status
        Long totalRentingContracts = 0L, totalFinishedContracts = 0L, totalCancelledContracts = 0L;
        for (Object[] result : contractStatusCounts) {
            Contract.Status status = (Contract.Status) result[0];
            Long count = (Long) result[1];
            
            switch (status) {
                case RENTING -> totalRentingContracts = count;
                case FINISHED -> totalFinishedContracts = count;
                case CANCELLED -> totalCancelledContracts = count;
            }
        }

        // 5. Lấy dữ liệu thống kê theo tháng (12 tháng gần nhất) và doanh thu hiện tại - CHỈ 1 LẦN GỌI
        List<ProviderStatisticsDTO.MonthlyRevenueDTO> monthlyRevenue = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusMonths(11).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endDate = now.plusMonths(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        List<Object[]> combinedData = finalContractRepository.getCurrentMonthAndMonthlyDataByProvider(userId, startDate, endDate);
        
        // Xử lý dữ liệu kết hợp
        BigDecimal totalRevenue = BigDecimal.ZERO;
        Long totalFinalContracts = 0L;
        var monthlyDataMap = new java.util.HashMap<String, Object[]>();
        
        for (Object[] data : combinedData) {
            String dataType = (String) data[0];
            Integer month = (Integer) data[1];
            Integer year = (Integer) data[2];
            BigDecimal revenue = (BigDecimal) data[3];
            Long count = (Long) data[4];
            
            if ("CURRENT".equals(dataType)) {
                // Dữ liệu tháng hiện tại
                totalRevenue = revenue;
                totalFinalContracts = count;
            } else {
                // Dữ liệu các tháng khác
                String key = year + "-" + String.format("%02d", month);
                monthlyDataMap.put(key, new Object[]{revenue, count});
            }
        }
        
        // Tạo danh sách 12 tháng gần nhất
        for (int i = 11; i >= 0; i--) {
            LocalDateTime targetDate = now.minusMonths(i);
            int month = targetDate.getMonthValue();
            int year = targetDate.getYear();
            String key = year + "-" + String.format("%02d", month);
            
            BigDecimal monthRevenue = BigDecimal.ZERO;
            Long monthOrderCount = 0L;
            
            if (monthlyDataMap.containsKey(key)) {
                Object[] data = monthlyDataMap.get(key);
                monthRevenue = (BigDecimal) data[0];
                monthOrderCount = (Long) data[1];
            }
            
            String monthName = targetDate.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
            
            monthlyRevenue.add(ProviderStatisticsDTO.MonthlyRevenueDTO.builder()
                    .month(monthName)
                    .orderCount(monthOrderCount)
                    .revenue(monthRevenue)
                    .build());
        }

        return ProviderStatisticsDTO.builder()
                .providerId(provider.getId())
                .providerName(provider.getFullName())
                .providerEmail(provider.getEmail())
                .providerPhone(provider.getPhone())
                .providerAddress(provider.getAddress())
                .openTime(provider.getOpenTime())
                .closeTime(provider.getCloseTime())
                .registeredServices(registeredServices)
                .totalVehicles(totalVehicles)
                .totalCars(totalCars)
                .totalMotorbikes(totalMotorbikes)
                .totalBicycles(totalBicycles)
                .totalRentingContracts(totalRentingContracts)
                .totalFinishedContracts(totalFinishedContracts)
                .totalCancelledContracts(totalCancelledContracts)
                .totalRevenue(totalRevenue)
                .totalFinalContracts(totalFinalContracts)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }
}