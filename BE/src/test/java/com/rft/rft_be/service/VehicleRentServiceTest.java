package com.rft.rft_be.service;

import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleThumbGroupDTO;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.ExtraFeeRuleMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.vehicleRent.VehicleRentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.oauth2.jwt.Jwt;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VehicleRentServiceTest {
    @InjectMocks
    private VehicleRentServiceImpl vehicleRentService;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private BrandRepository brandRepository;
    @Mock private ModelRepository modelRepository;
    @Mock private UserRepository userRepository;
    @Mock private VehicleMapper vehicleMapper;
    @Mock private PenaltyRepository penaltyRepository;
    @Mock private ExtraFeeRuleRepository extraFeeRuleRepository;
    @Mock private ExtraFeeRuleMapper extraFeeRuleMapper;
    @Mock private SecurityContext securityContext;
    @Mock private JwtAuthenticationToken jwtAuthenticationToken;
    @Mock private Jwt jwt;

    private static final String TEST_USER_ID = "test-user-id";
    private static final String TEST_VEHICLE_ID = "test-vehicle-id";
    private static final String TEST_BRAND_ID = "test-brand-id";
    private static final String TEST_MODEL_ID = "test-model-id";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        SecurityContextHolder.setContext(securityContext);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        when(jwt.getClaim("userId")).thenReturn(TEST_USER_ID);
    }

    // --- getProviderCar ---
    @Test
    void getProviderCar_success() {

        List<Vehicle> vehicles = Collections.singletonList(createMockVehicle());
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.CAR)).thenReturn(vehicles);
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        PageResponseDTO<VehicleGetDTO> result = vehicleRentService.getProviderCar(0, 1, "id", "asc");
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }
    @Test
    void getProviderCar_empty() {

        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.CAR)).thenReturn(Collections.emptyList());
        PageResponseDTO<VehicleGetDTO> result = vehicleRentService.getProviderCar(0, 1, "id", "asc");
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
    }

    // --- createVehicle ---
    @Test
    void createVehicle_success() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        User user = createMockUser();
        Brand brand = createMockBrand();
        Model model = createMockModel();
        Vehicle vehicle = createMockVehicle();
        VehicleGetDTO dto = createMockVehicleGetDTO();
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(user));
        when(brandRepository.findById(TEST_BRAND_ID)).thenReturn(Optional.of(brand));
        when(modelRepository.findById(TEST_MODEL_ID)).thenReturn(Optional.of(model));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), eq(TEST_USER_ID))).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(dto);
        VehicleGetDTO result = vehicleRentService.createVehicle(request);
        assertNotNull(result);
    }
    @Test
    void createVehicle_userNotFound() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        assertTrue(ex.getMessage().contains("Không tìm thấy người dùng"));
    }
    @Test
    void createVehicle_invalidVehicleType() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        ReflectionTestUtils.setField(request, "vehicleType", "INVALID");
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        assertTrue(ex.getMessage().contains("Loại xe không hợp lệ"));

    }
    @Test
    void createVehicle_licensePlateExists() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        when(brandRepository.findById(TEST_BRAND_ID)).thenReturn(Optional.of(createMockBrand()));
        when(modelRepository.findById(TEST_MODEL_ID)).thenReturn(Optional.of(createMockModel()));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), eq(TEST_USER_ID))).thenReturn(true);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        assertTrue(ex.getMessage().contains("Biển số đã tồn tại") || ex.getMessage().contains("Biển số xe đã tồn tại"));
    }

    // --- updateVehicle ---
    @Test
    void updateVehicle_success() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        VehicleGetDTO result = vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request);
        assertNotNull(result);
    }
    @Test
    void updateVehicle_notFound() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Không tìm thấy xe"));
    }

    // --- Validate enum & business logic ---
    @Test
    void updateVehicle_invalidVehicleType() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setVehicleType("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request);
        assertNull(vehicle.getVehicleType());
    }
    @Test
    void updateVehicle_invalidInsuranceStatus() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setInsuranceStatus("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Trạng thái bảo hiểm không hợp lệ"));
    }
    @Test
    void updateVehicle_invalidShipToAddress() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setShipToAddress("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Địa chỉ giao xe không hợp lệ"));
    }
    @Test
    void updateVehicle_invalidTransmission() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setTransmission("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Hộp số không hợp lệ"));
    }
    @Test
    void updateVehicle_invalidFuelType() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setFuelType("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Loại nhiên liệu không hợp lệ"));
    }
    @Test
    void updateVehicle_invalidHaveDriver() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setHaveDriver("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Giá trị có tài xế không hợp lệ"));
    }
    @Test
    void updateVehicle_invalidStatus() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setStatus("INVALID");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Trạng thái không hợp lệ"));
    }
    @Test
    void updateVehicle_licensePlateExists_otherVehicle() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setLicensePlate("DUPLICATE-PLATE");
        Vehicle vehicle = createMockVehicle();
        vehicle.setLicensePlate("OLD-PLATE");
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(vehicleRepository.existsByLicensePlate("DUPLICATE-PLATE")).thenReturn(true);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }
    @Test
    void updateVehicle_brandNotFound() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setBrandId("not-exist");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(brandRepository.findById("not-exist")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request);
        assertNull(vehicle.getBrand());
    }
    @Test
    void updateVehicle_modelNotFound() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setModelId("not-exist");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(modelRepository.findById("not-exist")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request);
        assertNull(vehicle.getModel());
    }

    // --- getVehicleById ---
    @Test
    void getVehicleById_success() {
        Vehicle vehicle = createMockVehicle();
        VehicleDetailDTO dto = createMockVehicleDetailDTO();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleToVehicleDetail(vehicle)).thenReturn(dto);
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(extraFeeRuleMapper.toDto(any(ExtraFeeRule.class))).thenReturn(null);
        VehicleDetailDTO result = vehicleRentService.getVehicleById(TEST_VEHICLE_ID);
        assertNotNull(result);
    }
    @Test
    void getVehicleById_notFound() {
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.getVehicleById(TEST_VEHICLE_ID));
        assertTrue(ex.getMessage().contains("Không tìm thấy xe"));
    }

    // --- countUserVehicles ---
    @Test
    void countUserVehicles_success() {
        // Use lenient to allow unnecessary stubbings from @BeforeEach
        lenient().when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        lenient().when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        lenient().when(jwt.getClaim("userId")).thenReturn(TEST_USER_ID);
        
        when(vehicleRepository.countByUserId(TEST_USER_ID)).thenReturn(5L);
        long result = vehicleRentService.countUserVehicles(TEST_USER_ID);
        assertEquals(5L, result);
    }

    // --- toggleVehicleStatus ---
    @Test
    void toggleVehicleStatus_success() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);

        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        assertNotNull(result);
    }
    @Test
    void toggleVehicleStatus_notFound() {
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID));
        assertTrue(ex.getMessage().contains("Không tìm thấy xe"));
    }
    @Test
    void toggleVehicleStatus_invalidInfo() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        vehicle.setCostPerDay(BigDecimal.ZERO); // thiếu costPerDay
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID));
        assertTrue(ex.getMessage().contains("Thiếu các trường bắt buộc"));
    }

    // --- getProviderCarGrouped ---
    @Test
    void getProviderCarGrouped_success() {
        List<Vehicle> vehicles = Collections.singletonList(createMockVehicle());
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.CAR)).thenReturn(vehicles);
        when(vehicleMapper.vehicleToVehicleDetail(any(Vehicle.class))).thenReturn(createMockVehicleDetailDTO());
        PageResponseDTO<VehicleThumbGroupDTO> result = vehicleRentService.getProviderCarGrouped(0, 1, "id", "asc");
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }
    @Test
    void getProviderCarGrouped_empty() {
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.CAR)).thenReturn(Collections.emptyList());
        PageResponseDTO<VehicleThumbGroupDTO> result = vehicleRentService.getProviderCarGrouped(0, 1, "id", "asc");
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
    }

    // --- getProviderMotorbikeGroupedByThumb ---
    @Test
    void getProviderMotorbikeGroupedByThumb_success() {
        Vehicle v1 = createMockVehicle(); v1.setThumb("thumb1");
        Vehicle v2 = createMockVehicle(); v2.setThumb("thumb1");
        v1.setVehicleType(Vehicle.VehicleType.MOTORBIKE);
        v2.setVehicleType(Vehicle.VehicleType.MOTORBIKE);
        List<Vehicle> vehicles = Arrays.asList(v1, v2);
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.MOTORBIKE)).thenReturn(vehicles);
        when(vehicleMapper.vehicleToVehicleDetail(any(Vehicle.class))).thenReturn(createMockVehicleDetailDTO());
        PageResponseDTO<VehicleThumbGroupDTO> result = vehicleRentService.getProviderMotorbikeGroupedByThumb(0, 1, "id", "asc");
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(2, result.getContent().get(0).getVehicle().size());
    }
    @Test
    void getProviderMotorbikeGroupedByThumb_empty() {
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.MOTORBIKE)).thenReturn(Collections.emptyList());
        PageResponseDTO<VehicleThumbGroupDTO> result = vehicleRentService.getProviderMotorbikeGroupedByThumb(0, 1, "id", "asc");
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
    }

    // --- getProviderBicycleGroupedByThumb ---
    @Test
    void getProviderBicycleGroupedByThumb_success() {
        Vehicle v1 = createMockVehicle(); v1.setThumb("thumb2");
        Vehicle v2 = createMockVehicle(); v2.setThumb("thumb2");
        v1.setVehicleType(Vehicle.VehicleType.BICYCLE);
        v2.setVehicleType(Vehicle.VehicleType.BICYCLE);
        List<Vehicle> vehicles = Arrays.asList(v1, v2);
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.BICYCLE)).thenReturn(vehicles);
        when(vehicleMapper.vehicleToVehicleDetail(any(Vehicle.class))).thenReturn(createMockVehicleDetailDTO());
        PageResponseDTO<VehicleThumbGroupDTO> result = vehicleRentService.getProviderBicycleGroupedByThumb(0, 1, "id", "asc");
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(2, result.getContent().get(0).getVehicle().size());
    }
    @Test
    void getProviderBicycleGroupedByThumb_empty() {
        when(vehicleRepository.findByUserIdAndVehicleType(TEST_USER_ID, Vehicle.VehicleType.BICYCLE)).thenReturn(Collections.emptyList());
        PageResponseDTO<VehicleThumbGroupDTO> result = vehicleRentService.getProviderBicycleGroupedByThumb(0, 1, "id", "asc");
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
    }

    // --- createMotorbie_Bicycle ---
    @Test
    void createMotorbie_Bicycle_success() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        request.setVehicleType("MOTORBIKE");
        request.setLicensePlate(Arrays.asList("PLATE-1", "PLATE-2"));
        request.setNumberVehicle(2);
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        when(vehicleRepository.findByUserId(TEST_USER_ID)).thenReturn(Collections.emptyList());
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), eq(TEST_USER_ID))).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(createMockVehicle());
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        List<VehicleGetDTO> result = vehicleRentService.createMotorbie_Bicycle(request);
        assertNotNull(result);
        assertEquals(2, result.size());
    }
    @Test
    void createMotorbie_Bicycle_licensePlateMismatch() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        request.setVehicleType("MOTORBIKE");
        request.setLicensePlate(Collections.singletonList("PLATE-1"));
        request.setNumberVehicle(2);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createMotorbie_Bicycle(request));
        assertTrue(ex.getMessage().contains("Số lượng biển số xe phải bằng số lượng xe"));
    }

    // --- updateCommonVehicleInfo ---
    @Test
    void updateCommonVehicleInfo_success() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        Vehicle vehicle = createMockVehicle();
        vehicle.setThumb("thumb-group");
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateCommonVehicleInfo(TEST_VEHICLE_ID, request);
        assertNotNull(result);
    }
    @Test
    void updateCommonVehicleInfo_notFound() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        // Sử dụng findByIdAndUserId thay vì findById
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateCommonVehicleInfo(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Không tìm thấy xe hoặc bạn không có quyền cập nhật nó"));
    }

    // --- updateSpecificVehicleInfo ---
    @Test
    void updateSpecificVehicleInfo_success() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findById(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateSpecificVehicleInfo(TEST_VEHICLE_ID, request);
        assertNotNull(result);
    }
    @Test
    void updateSpecificVehicleInfo_notFound() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        when(vehicleRepository.findById(TEST_VEHICLE_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateSpecificVehicleInfo(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Không tìm thấy xe"));
    }

    // --- Helper methods ---
    private Vehicle createMockVehicle() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(TEST_VEHICLE_ID);
        vehicle.setLicensePlate("TEST-123");
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setStatus(Vehicle.Status.AVAILABLE);
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setDescription("Test vehicle");
        vehicle.setVehicleImages("[\"image1.jpg\"]");
        vehicle.setThumb("thumb.jpg");
        vehicle.setNumberVehicle(1);
        vehicle.setUser(createMockUser());
        return vehicle;
    }
    private User createMockUser() {
        User user = new User();
        user.setId(TEST_USER_ID);
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setAddress("Test Address, District, City");
        return user;
    }
    private Brand createMockBrand() {
        Brand brand = new Brand();
        brand.setId(TEST_BRAND_ID);
        brand.setName("Test Brand");
        return brand;
    }
    private Model createMockModel() {
        Model model = new Model();
        model.setId(TEST_MODEL_ID);
        model.setName("Test Model");
        return model;
    }
    private VehicleGetDTO createMockVehicleGetDTO() {
        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setId(TEST_VEHICLE_ID);
        dto.setLicensePlate("TEST-123");
        dto.setCostPerDay(BigDecimal.valueOf(100));
        dto.setUserId(TEST_USER_ID);
        dto.setUserName("Test User");
        dto.setBrandId(TEST_BRAND_ID);
        dto.setBrandName("Test Brand");
        dto.setModelId(TEST_MODEL_ID);
        dto.setModelName("Test Model");
        return dto;
    }
    private VehicleDetailDTO createMockVehicleDetailDTO() {
        VehicleDetailDTO dto = new VehicleDetailDTO();
        dto.setId(TEST_VEHICLE_ID);
        dto.setLicensePlate("TEST-123");
        dto.setCostPerDay(BigDecimal.valueOf(100));
        dto.setUserId(TEST_USER_ID);
        dto.setUserName("Test User");
        dto.setBrandName("Test Brand");
        dto.setModelName("Test Model");
        return dto;
    }
    private VehicleRentCreateDTO createMockVehicleCreateDTO() {
        return VehicleRentCreateDTO.builder()
                .vehicleType("CAR")
                .brandId(TEST_BRAND_ID)
                .modelId(TEST_MODEL_ID)
                .licensePlate(Collections.singletonList("TEST-123"))
                .costPerDay(BigDecimal.valueOf(100))
                .description("Test vehicle")
                .thumb("thumb.jpg")
                .numberVehicle(1)
                .insuranceStatus("YES")
                .shipToAddress("YES")
                .transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .haveDriver("NO")
                .numberSeat(4)
                .yearManufacture(2020)
                .maxKmPerDay(200)
                .feePerExtraKm(5)
                .allowedHourLate(2)
                .feePerExtraHour(10)
                .cleaningFee(50)
                .smellRemovalFee(100)
                .batteryChargeFeePerPercent(2)
                .driverFeePerDay(200)
                .hasDriverOption(true)
                .driverFeePerHour(25)
                .hasHourlyRental(true)
                .build();
    }
    private VehicleRentUpdateDTO createMockVehicleUpdateDTO() {
        VehicleRentUpdateDTO dto = new VehicleRentUpdateDTO();
        dto.setLicensePlate("UPDATED-123");
        dto.setCostPerDay(BigDecimal.valueOf(150));
        dto.setDescription("Updated vehicle");
        dto.setVehicleType("CAR");
        dto.setInsuranceStatus("YES");
        dto.setShipToAddress("YES");
        dto.setTransmission("AUTOMATIC");
        dto.setFuelType("GASOLINE");
        dto.setHaveDriver("NO");
        dto.setStatus("AVAILABLE");
        return dto;
    }

    // --- BỔ SUNG TEST TĂNG BRANCH COVERAGE ---

    @Test
    void createVehicle_car_brandNotFound() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        when(brandRepository.findById(TEST_BRAND_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        // Sửa lại message cho đúng với thực tế
        assertTrue(ex.getMessage().contains("Xe hơi phải có hãng"));
    }

    @Test
    void createVehicle_car_modelNotFound() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        when(brandRepository.findById(TEST_BRAND_ID)).thenReturn(Optional.of(createMockBrand()));
        when(modelRepository.findById(TEST_MODEL_ID)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        // Sửa lại message cho đúng với thực tế
        assertTrue(ex.getMessage().contains("Xe phải có mô hình hợp lệ"));
    }

    @Test
    void createVehicle_penaltyNotFound() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        request.setPenaltyId("not-exist");
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        when(brandRepository.findById(TEST_BRAND_ID)).thenReturn(Optional.of(createMockBrand()));
        when(modelRepository.findById(TEST_MODEL_ID)).thenReturn(Optional.of(createMockModel()));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), eq(TEST_USER_ID))).thenReturn(false);
        when(penaltyRepository.findById("not-exist")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        assertTrue(ex.getMessage().contains("Phạt không tồn tại với id:"));
    }

    @Test
    void createVehicle_car_licensePlateExists() {
        VehicleRentCreateDTO request = createMockVehicleCreateDTO();
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(createMockUser()));
        when(brandRepository.findById(TEST_BRAND_ID)).thenReturn(Optional.of(createMockBrand()));
        when(modelRepository.findById(TEST_MODEL_ID)).thenReturn(Optional.of(createMockModel()));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), eq(TEST_USER_ID))).thenReturn(true);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        // Sửa lại message cho đúng với thực tế
        assertTrue(ex.getMessage().contains("Biển số đã tồn tại") || ex.getMessage().contains("Biển số xe đã tồn tại"));
    }

    @Test
    void updateVehicle_brandNotFound_branch() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setBrandId("not-exist");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(brandRepository.findById("not-exist")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request);
        assertNull(vehicle.getBrand());
    }

    @Test
    void updateVehicle_modelNotFound_branch() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setModelId("not-exist");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(modelRepository.findById("not-exist")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
        VehicleGetDTO result = vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request);
        assertNull(vehicle.getModel());
    }

    @Test
    void updateVehicle_penaltyNotFound_branch() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setPenaltyId("not-exist");
        Vehicle vehicle = createMockVehicle();
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(penaltyRepository.findById("not-exist")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("Phạt không tồn tại với id:"));
    }

    @Test
    void updateVehicle_licensePlateExists_dbNull() {
        VehicleRentUpdateDTO request = createMockVehicleUpdateDTO();
        request.setLicensePlate("DUPLICATE-PLATE");
        Vehicle vehicle = createMockVehicle();
        vehicle.setLicensePlate(null);
        when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
        when(extraFeeRuleRepository.findByVehicleId(TEST_VEHICLE_ID)).thenReturn(new ExtraFeeRule());
        when(vehicleRepository.existsByLicensePlate("DUPLICATE-PLATE")).thenReturn(true);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle(TEST_VEHICLE_ID, request));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    // --- validateVehicleForAvailability: test thiếu từng trường ---
    @Test
    void validateVehicleForAvailability_missingCostPerDay() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setCostPerDay(BigDecimal.ZERO);
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("cost_per_day"));
    }

    // --- BỔ SUNG TEST CHO CÁC NHÁNH VALIDATE/ELSE/DEFAULT ---

    @Test
    void validateVehicleForAvailability_missingDescription() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setDescription("");
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("description"));
    }

    @Test
    void validateVehicleForAvailability_missingVehicleImages() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setVehicleImages("");
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("vehicle_images"));
    }

    @Test
    void validateVehicleForAvailability_missingThumb() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setThumb("");
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("thumb"));
    }


    @Test
    void validateCarRequirements_missingBrand() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(null);
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("brand"));
    }

    @Test
    void validateCarRequirements_missingModel() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(null);
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("model"));
    }

    @Test
    void validateCarRequirements_missingLicensePlate() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setLicensePlate("");
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("license_plate"));
    }

    @Test
    void validateCarRequirements_missingNumberSeat() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(0);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("number_seat"));
    }

    @Test
    void validateCarRequirements_missingYearManufacture() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(0);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("year_manufacture"));
    }

    @Test
    void validateCarRequirements_missingTransmission() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(null);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("transmission"));
    }

    @Test
    void validateCarRequirements_missingFuelType() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(null);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("fuel_type"));
    }

    @Test
    void validateCarRequirements_missingInsuranceStatus() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(null);
        vehicle.setShipToAddress(Vehicle.ShipToAddress.YES);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("insurance_status"));
    }

    @Test
    void validateCarRequirements_missingShipToAddress() {
        Vehicle vehicle = createMockVehicle();
        vehicle.setBrand(createMockBrand());
        vehicle.setModel(createMockModel());
        vehicle.setNumberSeat(4);
        vehicle.setYearManufacture(2020);
        vehicle.setTransmission(Vehicle.Transmission.AUTOMATIC);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setInsuranceStatus(Vehicle.InsuranceStatus.YES);
        vehicle.setShipToAddress(null);
        vehicle.setThumb("thumb.jpg");
        vehicle.setVehicleImages("[\"img.jpg\"]");
        vehicle.setDescription("desc");
        vehicle.setCostPerDay(BigDecimal.valueOf(100));
        vehicle.setStatus(Vehicle.Status.UNAVAILABLE);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            when(vehicleRepository.findByIdAndUserId(TEST_VEHICLE_ID, TEST_USER_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
            lenient().when(vehicleRepository.findByIdWithBrandAndModel(TEST_VEHICLE_ID)).thenReturn(Optional.of(vehicle));
            lenient().when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(createMockVehicleGetDTO());
            vehicleRentService.toggleVehicleStatus(TEST_VEHICLE_ID);
        });
        assertTrue(ex.getMessage().contains("ship_to_address"));
    }
}
