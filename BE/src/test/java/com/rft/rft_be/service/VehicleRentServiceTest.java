package com.rft.rft_be.service;

import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.VehicleImageDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;

import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.entity.Brand;
import com.rft.rft_be.entity.Model;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.BrandRepository;
import com.rft.rft_be.repository.ModelRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.vehicleRent.VehicleRentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;
import com.rft.rft_be.dto.vehicle.VehicleFeatureDTO;
import com.rft.rft_be.repository.PenaltyRepository;
import com.rft.rft_be.entity.Penalty;
import java.time.LocalDateTime;
@SuppressWarnings("UnnecessaryStubbing")
@ExtendWith(MockitoExtension.class)
public class VehicleRentServiceTest {

    @InjectMocks
    private VehicleRentServiceImpl vehicleRentService;

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private BrandRepository brandRepository;
    @Mock
    private ModelRepository modelRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VehicleMapper vehicleMapper;
    @Mock
    private PenaltyRepository penaltyRepository;

    private VehicleRentCreateDTO request;
    private VehicleRentUpdateDTO updateRequest;
    private VehicleGetDTO mockVehicleGetDTO;
    private VehicleDetailDTO mockVehicleDetailDTO;
    private VehicleDTO mockVehicleDTO;
    private Vehicle mockVehicle;
    private User mockUser;
    private Brand mockBrand;
    private Model mockModel;

    @BeforeEach
    void setUp() {
        // Setup mock data
        mockUser = User.builder().id("testUserId").build();
        mockBrand = Brand.builder().id("brand123").name("Honda").build();
        mockModel = Model.builder().id("model456").name("Wave Alpha").build(); // Không có .brand(mockBrand)

        mockVehicle = Vehicle.builder()
                .id("vehicleId123")
                .user(mockUser)
                .brand(mockBrand)
                .model(mockModel)
                .licensePlate("ABC-123")
                .vehicleType(Vehicle.VehicleType.MOTORBIKE)
                .vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus(Vehicle.InsuranceStatus.YES)
                .shipToAddress(Vehicle.ShipToAddress.NO)
                .numberSeat(2)
                .yearManufacture(2022)
                .transmission(Vehicle.Transmission.AUTOMATIC)
                .fuelType(Vehicle.FuelType.GASOLINE)
                .description("Xe máy test.")
                .numberVehicle(1)
                .haveDriver(Vehicle.HaveDriver.NO)
                .status(Vehicle.Status.AVAILABLE)
                .costPerDay(new BigDecimal("50.00"))
                .thumb("thumb")
                .totalRatings(0)
                .likes(0)
                .build();

        request = VehicleRentCreateDTO.builder()
                .brandId("brand123")
                .modelId("model456")
                .licensePlate("ABC-123")
                .vehicleType("MOTORBIKE")
                .vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus("YES")
                .shipToAddress("NO")
                .numberSeat(2)
                .yearManufacture(2022)
                .transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .description("Xe máy test.")
                .numberVehicle(1)
                .haveDriver("NO")
                .status("AVAILABLE")
                .costPerDay(new BigDecimal("50.00"))
                .thumb("thumb")
                .build();

        updateRequest = VehicleRentUpdateDTO.builder()
                .brandId("brand123")
                .modelId("model456")
                .licensePlate("ABC-123")
                .vehicleType("MOTORBIKE")
                .vehicleFeatures("GPS, Bluetooth, Camera")
                .vehicleImages("img1.jpg,img2.jpg,img3.jpg")
                .insuranceStatus("YES")
                .shipToAddress("NO")
                .numberSeat(2)
                .yearManufacture(2022)
                .transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .description("Xe máy test đã cập nhật.")
                .numberVehicle(1)
                .haveDriver("NO")
                .status("AVAILABLE")
                .costPerDay(new BigDecimal("60.00"))
                .thumb("thumb_updated")
                .build();

        List<VehicleImageDTO> expectedVehicleImages;
        String vehicleImagesString = request.getVehicleImages();
        if (vehicleImagesString != null && !vehicleImagesString.isEmpty()) {
            expectedVehicleImages = Arrays.stream(vehicleImagesString.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(url -> VehicleImageDTO.builder().imageUrl(url).build())
                    .collect(Collectors.toList());
        } else {
            expectedVehicleImages = List.of();
        }

        mockVehicleGetDTO = VehicleGetDTO.builder()
                .id("vehicleId123")
                .licensePlate(request.getLicensePlate())
                .vehicleType(request.getVehicleType())
                .vehicleFeatures("GPS, Bluetooth")
                .vehicleImages(expectedVehicleImages)
                .description(request.getDescription())
                .costPerDay(request.getCostPerDay())
                .status("AVAILABLE")
                .thumb(request.getThumb())
                .numberSeat(request.getNumberSeat())
                .yearManufacture(request.getYearManufacture())
                .transmission(request.getTransmission())
                .fuelType(request.getFuelType())
                .brandName("Honda")
                .modelName("Wave Alpha")
                .rating(0.0)
                .address("Some address")
                .build();

        mockVehicleDetailDTO = VehicleDetailDTO.builder()
                .id("vehicleId123")
                .licensePlate(request.getLicensePlate())
                .vehicleType(request.getVehicleType())
                .vehicleFeatures(List.of(new VehicleFeatureDTO("GPS"), new VehicleFeatureDTO("Bluetooth")))
                .vehicleImages(expectedVehicleImages)
                .description(request.getDescription())
                .costPerDay(request.getCostPerDay())
                .status("AVAILABLE")
                .thumb(request.getThumb())
                .numberSeat(request.getNumberSeat())
                .shipToAddress(request.getShipToAddress())
                .yearManufacture(request.getYearManufacture())
                .transmission(request.getTransmission())
                .fuelType(request.getFuelType())
                .brandName("Honda")
                .modelName("Wave Alpha")
                .rating(0.0)
                .address("Some address")
                .userComments(List.of())
                .build();

        mockVehicleDTO = VehicleDTO.builder()
                .id("vehicleId123")
                .licensePlate(request.getLicensePlate())
                .vehicleType(request.getVehicleType())
                .vehicleFeatures(List.of(new VehicleFeatureDTO("GPS"), new VehicleFeatureDTO("Bluetooth")))
                .vehicleImages(expectedVehicleImages)
                .description(request.getDescription())
                .costPerDay(request.getCostPerDay())
                .status("AVAILABLE")
                .thumb(request.getThumb())
                .numberSeat(request.getNumberSeat())
                .yearManufacture(request.getYearManufacture())
                .transmission(request.getTransmission())
                .fuelType(request.getFuelType())
                .brandName("Honda")
                .modelName("Wave Alpha")
                .rating(0.0)
                .address("Some address")
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        JwtAuthenticationToken authentication = mock(JwtAuthenticationToken.class);
        Jwt jwt = new Jwt(
                "token",
                null,
                null,
                Map.of("alg", "none"),
                Map.of("userId", "testUserId")
        );
        when(authentication.getToken()).thenReturn(jwt);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Các mock thực sự cần cho mọi test giữ nguyên
        when(userRepository.findById("testUserId")).thenReturn(Optional.of(mockUser));
        // Các mock còn lại chuyển sang dùng lenient()
        lenient().when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        lenient().when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        lenient().when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), anyString())).thenReturn(false);
        lenient().when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        lenient().when(vehicleRepository.findByIdWithBrandAndModel("vehicleId123")).thenReturn(Optional.of(mockVehicle));
        lenient().when(vehicleMapper.vehicleGet(mockVehicle)).thenReturn(mockVehicleGetDTO);
        lenient().when(vehicleMapper.vehicleToVehicleDetail(mockVehicle)).thenReturn(mockVehicleDetailDTO);
    }

    // ========== CREATE VEHICLE TESTS ==========

    // ========== CAR TESTS ==========
    @Test
    void createVehicle_Car_Success() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123")
                .modelId("model456")
                .licensePlate("CAR-123")
                .vehicleType("CAR")
                .vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus("YES")
                .shipToAddress("YES")
                .numberSeat(5)
                .yearManufacture(2023)
                .transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .description("Xe hơi cao cấp.")
                .numberVehicle(1)
                .haveDriver("YES")
                .status("AVAILABLE")
                .costPerDay(new BigDecimal("200.00"))
                .thumb("car_thumb.jpg")
                .build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), anyString())).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(carRequest);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    void createVehicle_Car_WithoutLicensePlate_ThrowsException() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("YES").numberSeat(5).yearManufacture(2023)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1)
                .haveDriver("YES").status("AVAILABLE")
                .costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(carRequest));
        assertEquals("Vehicle must have a license plate", exception.getMessage());

    }

    @Test
    void createVehicle_Car_WithoutBrand_ThrowsException() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .modelId("model456").licensePlate("CAR-123")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("YES").numberSeat(5).yearManufacture(2023)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1)
                .haveDriver("YES").status("AVAILABLE")
                .costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg").build();
        when(brandRepository.findById(null)).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(carRequest));
        assertTrue(exception.getMessage().contains("brand"));

    }

    @Test
    void createVehicle_Car_WithoutModel_ThrowsException() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").licensePlate("CAR-123")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("YES").numberSeat(5).yearManufacture(2023)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1)
                .haveDriver("YES").status("AVAILABLE")
                .costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById(null)).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(carRequest));
        assertTrue(exception.getMessage().contains("model"));
    }

    @Test
    void createVehicle_Car_DuplicateLicensePlate_ThrowsException() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("CAR-123")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("YES").numberSeat(5).yearManufacture(2023)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1)
                .haveDriver("YES").status("AVAILABLE")
                .costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), anyString())).thenReturn(true);
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(carRequest));
        assertTrue(exception.getMessage().contains("License plate already exists"));

    }

    @Test
    void createVehicle_Car_EmptyLicensePlate_ThrowsException() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("   ")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("YES").numberSeat(5).yearManufacture(2023)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1)
                .haveDriver("YES").status("AVAILABLE")
                .costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(carRequest));
        assertEquals("Vehicle must have a license plate", exception.getMessage());

    }

    @Test
    void createVehicle_Car_WithoutImage_DoesNotThrow() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("CAR-123")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .insuranceStatus("YES").shipToAddress("YES").numberSeat(5)
                .yearManufacture(2023).transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1).haveDriver("YES")
                .status("AVAILABLE").costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg")
                .build(); // thiếu vehicleImages
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(carRequest));

    }

    @Test
    void createVehicle_Car_WithoutFeature_DoesNotThrow() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("CAR-123")
                .vehicleType("CAR").vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus("YES").shipToAddress("YES").numberSeat(5)
                .yearManufacture(2023).transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1).haveDriver("YES")
                .status("AVAILABLE").costPerDay(new BigDecimal("200.00")).thumb("car_thumb.jpg")
                .build(); // thiếu vehicleFeatures
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(carRequest));

    }

    @Test
    void createVehicle_Car_WithoutCostPerDay_DoesNotThrow() {
        VehicleRentCreateDTO carRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("CAR-123")
                .vehicleType("CAR").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("YES").numberSeat(5).yearManufacture(2023)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe hơi cao cấp.").numberVehicle(1).haveDriver("YES")
                .status("AVAILABLE").thumb("car_thumb.jpg")
                .build(); // thiếu costPerDay
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(carRequest));

    }

    // ========== MOTORBIKE TESTS ==========
    @Test
    void createVehicle_Motorbike_Success() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("MB-123")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("NO").numberSeat(2).yearManufacture(2022)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), anyString())).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(motorbikeRequest);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    void createVehicle_Motorbike_WithoutLicensePlate_ThrowsException() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("NO").numberSeat(2).yearManufacture(2022)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(motorbikeRequest));
        assertEquals("Vehicle must have a license plate", exception.getMessage());

    }

    @Test
    void createVehicle_Motorbike_WithoutBrand_ThrowsException() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .modelId("model456").licensePlate("MB-123")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("NO").numberSeat(2).yearManufacture(2022)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg").build();
        when(brandRepository.findById(null)).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(motorbikeRequest));
        assertTrue(exception.getMessage().contains("brand"));
    }

    @Test
    void createVehicle_Motorbike_DuplicateLicensePlate_ThrowsException() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("MB-123")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("NO").numberSeat(2).yearManufacture(2022)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), anyString())).thenReturn(true);
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(motorbikeRequest));
        assertTrue(exception.getMessage().contains("License plate already exists"));

    }

    @Test
    void createVehicle_Motorbike_EmptyLicensePlate_ThrowsException() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("   ")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("NO").numberSeat(2).yearManufacture(2022)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(motorbikeRequest));
        assertEquals("Vehicle must have a license plate", exception.getMessage());

    }

    @Test
    void createVehicle_Motorbike_WithoutImage_DoesNotThrow() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("MB-123")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .insuranceStatus("YES").shipToAddress("NO").numberSeat(2)
                .yearManufacture(2022).transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1).haveDriver("NO")
                .status("AVAILABLE").costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg")
                .build(); // thiếu vehicleImages
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(motorbikeRequest));

    }

    @Test
    void createVehicle_Motorbike_WithoutFeature_DoesNotThrow() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("MB-123")
                .vehicleType("MOTORBIKE").vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus("YES").shipToAddress("NO").numberSeat(2)
                .yearManufacture(2022).transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1).haveDriver("NO")
                .status("AVAILABLE").costPerDay(new BigDecimal("50.00")).thumb("mb_thumb.jpg")
                .build(); // thiếu vehicleFeatures
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(motorbikeRequest));

    }

    @Test
    void createVehicle_Motorbike_WithoutCostPerDay_DoesNotThrow() {
        VehicleRentCreateDTO motorbikeRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("MB-123")
                .vehicleType("MOTORBIKE").vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("YES")
                .shipToAddress("NO").numberSeat(2).yearManufacture(2022)
                .transmission("AUTOMATIC").fuelType("GASOLINE")
                .description("Xe máy test.").numberVehicle(1).haveDriver("NO")
                .status("AVAILABLE").thumb("mb_thumb.jpg")
                .build(); // thiếu costPerDay
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(motorbikeRequest));

    }

    // ========== BICYCLE TESTS ==========
    @Test
    void createVehicle_Bicycle_Success() {
        VehicleRentCreateDTO bicycleRequest = VehicleRentCreateDTO.builder()
                .vehicleType("BICYCLE").vehicleFeatures("Basket, Bell, Light")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("NO")
                .shipToAddress("NO").numberSeat(1).yearManufacture(2023)
                .transmission("MANUAL").fuelType("NONE")
                .description("Xe đạp cao cấp.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("10.00")).thumb("bicycle_thumb.jpg").build();
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(bicycleRequest);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    void createVehicle_Bicycle_WithBrandAndModel_IgnoresBrandAndModel() {
        VehicleRentCreateDTO bicycleRequest = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456")
                .vehicleType("BICYCLE").vehicleFeatures("Basket, Bell")
                .vehicleImages("img1.jpg").insuranceStatus("NO")
                .shipToAddress("NO").numberSeat(1).yearManufacture(2023)
                .transmission("MANUAL").fuelType("NONE")
                .description("Xe đạp test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("10.00")).thumb("thumb").build();
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(bicycleRequest);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    void createVehicle_Bicycle_WithLicensePlate_IgnoresLicensePlate() {
        VehicleRentCreateDTO bicycleRequest = VehicleRentCreateDTO.builder()
                .licensePlate("BIC-123")
                .vehicleType("BICYCLE").vehicleFeatures("Basket, Bell")
                .vehicleImages("img1.jpg").insuranceStatus("NO")
                .shipToAddress("NO").numberSeat(1).yearManufacture(2023)
                .transmission("MANUAL").fuelType("NONE")
                .description("Xe đạp test.").numberVehicle(1)
                .haveDriver("NO").status("AVAILABLE")
                .costPerDay(new BigDecimal("10.00")).thumb("thumb").build();
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(bicycleRequest);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    void createVehicle_Bicycle_WithoutImage_DoesNotThrow() {
        VehicleRentCreateDTO bicycleRequest = VehicleRentCreateDTO.builder()
                .vehicleType("BICYCLE").vehicleFeatures("Basket, Bell, Light")
                .insuranceStatus("NO").shipToAddress("NO").numberSeat(1)
                .yearManufacture(2023).transmission("MANUAL").fuelType("NONE")
                .description("Xe đạp cao cấp.").numberVehicle(1).haveDriver("NO")
                .status("AVAILABLE").costPerDay(new BigDecimal("10.00")).thumb("bicycle_thumb.jpg")
                .build(); // thiếu vehicleImages
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(bicycleRequest));

    }

    @Test
    void createVehicle_Bicycle_WithoutFeature_DoesNotThrow() {
        VehicleRentCreateDTO bicycleRequest = VehicleRentCreateDTO.builder()
                .vehicleType("BICYCLE").vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus("NO").shipToAddress("NO").numberSeat(1)
                .yearManufacture(2023).transmission("MANUAL").fuelType("NONE")
                .description("Xe đạp cao cấp.").numberVehicle(1).haveDriver("NO")
                .status("AVAILABLE").costPerDay(new BigDecimal("10.00")).thumb("bicycle_thumb.jpg")
                .build(); // thiếu vehicleFeatures
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(bicycleRequest));

    }

    @Test
    void createVehicle_Bicycle_WithoutCostPerDay_DoesNotThrow() {
        VehicleRentCreateDTO bicycleRequest = VehicleRentCreateDTO.builder()
                .vehicleType("BICYCLE").vehicleFeatures("Basket, Bell, Light")
                .vehicleImages("img1.jpg,img2.jpg").insuranceStatus("NO")
                .shipToAddress("NO").numberSeat(1).yearManufacture(2023)
                .transmission("MANUAL").fuelType("NONE")
                .description("Xe đạp cao cấp.").numberVehicle(1).haveDriver("NO")
                .status("AVAILABLE").thumb("bicycle_thumb.jpg")
                .build(); // thiếu costPerDay
        assertDoesNotThrow(() -> vehicleRentService.createVehicle(bicycleRequest));

    }

    // ========== GENERAL VALIDATION TESTS ==========
    @Test
    void createVehicle_InvalidVehicleType_ThrowsException() {
        VehicleRentCreateDTO invalidRequest = VehicleRentCreateDTO.builder()
                .vehicleType("INVALID_TYPE").build();
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(invalidRequest));
        assertTrue(exception.getMessage().contains("Invalid vehicle type"));

    }

    @Test
    void createVehicle_UserNotFound_ThrowsException() {
        when(userRepository.findById("testUserId")).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(request));
        assertTrue(exception.getMessage().contains("User not found"));

    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void getUserVehicles_Success() {
        // Arrange
        Page<Vehicle> page = new PageImpl<>(List.of(mockVehicle));
        when(vehicleRepository.findByUserIdWithBrandAndModel(anyString(), any(Pageable.class))).thenReturn(page);
        when(vehicleMapper.toDTO(any(Vehicle.class))).thenReturn(mockVehicleDTO);

        // Act
        PageResponseDTO<VehicleDTO> result = vehicleRentService.getUserVehicles(0, 10, "createdAt", "desc");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(mockVehicleDTO, result.getContent().get(0));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void getUserVehicles_NullPage_ReturnsEmpty() {
        // Arrange
        when(vehicleRepository.findByUserIdWithBrandAndModel(anyString(), any(Pageable.class))).thenReturn(null);

        // Act & Assert
        assertThrows(NullPointerException.class, () -> vehicleRentService.getUserVehicles(0, 10, "createdAt", "desc"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_Success() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);

        VehicleGetDTO result = vehicleRentService.updateVehicle("vehicleId123", updateRequest);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_NotFound_ThrowsException() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle("vehicleId123", updateRequest));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_BrandNotFound_ThrowsException() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(brandRepository.findById("notfound")).thenReturn(Optional.empty());
        VehicleRentUpdateDTO req = VehicleRentUpdateDTO.builder().brandId("notfound").build();
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle("vehicleId123", req));
        assertTrue(ex.getMessage().contains("Brand not found"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_ModelNotFound_ThrowsException() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(modelRepository.findById("notfound")).thenReturn(Optional.empty());
        VehicleRentUpdateDTO req = VehicleRentUpdateDTO.builder().modelId("notfound").build();
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle("vehicleId123", req));
        assertTrue(ex.getMessage().contains("Model not found"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_DuplicateLicensePlate_ThrowsException() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleRepository.existsByLicensePlateAndUserIdAndIdNot(anyString(), anyString(), anyString())).thenReturn(true);
        VehicleRentUpdateDTO req = VehicleRentUpdateDTO.builder().licensePlate("DUPLICATE").build();
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.updateVehicle("vehicleId123", req));
        assertTrue(ex.getMessage().contains("License plate already exists"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_UpdateAllFields_Success() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(brandRepository.findById(anyString())).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById(anyString())).thenReturn(Optional.of(mockModel));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleRentUpdateDTO req = VehicleRentUpdateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("NEW-PLATE")
                .vehicleType("CAR").vehicleFeatures("GPS").vehicleImages("img.jpg")
                .insuranceStatus("YES").shipToAddress("YES").numberSeat(4)
                .yearManufacture(2020).transmission("MANUAL").fuelType("GASOLINE")
                .description("desc").numberVehicle(2).costPerDay(new BigDecimal("100"))
                .status("AVAILABLE").thumb("thumb").build();
        VehicleGetDTO result = vehicleRentService.updateVehicle("vehicleId123", req);
        assertNotNull(result);
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_AllFieldsNull_OnlyUpdateAt() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleRentUpdateDTO req = VehicleRentUpdateDTO.builder().build();
        VehicleGetDTO result = vehicleRentService.updateVehicle("vehicleId123", req);
        assertNotNull(result);
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void getVehicleById_Success() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleToVehicleDetail(any(Vehicle.class))).thenReturn(mockVehicleDetailDTO);

        VehicleDetailDTO result = vehicleRentService.getVehicleById("vehicleId123");
        assertNotNull(result);
        assertEquals(mockVehicleDetailDTO, result);
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void getVehicleById_NotFound_ThrowsException() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> vehicleRentService.getVehicleById("vehicleId123"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void countUserVehicles_Success() {
        when(vehicleRepository.countByUserId(anyString())).thenReturn(2L);
        long count = vehicleRentService.countUserVehicles("testUserId");
        assertEquals(2L, count);
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void toggleVehicleStatus_Success() {
        Vehicle vehicle = Vehicle.builder().status(Vehicle.Status.AVAILABLE).build();
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);

        VehicleGetDTO result = vehicleRentService.toggleVehicleStatus("vehicleId123");
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void toggleVehicleStatus_NotFound_ThrowsException() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus("vehicleId123"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void toggleVehicleStatus_ValidateVehicleForAvailability_ThrowsException() {
        // Vehicle UNAVAILABLE, thiếu brand/model/licensePlate để validateVehicleForAvailability throw
        Vehicle unavailableVehicle = Vehicle.builder().id("vehicleId123").user(mockUser).status(Vehicle.Status.UNAVAILABLE).build();
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(unavailableVehicle));
        // Không cần spy, gọi thật để coverage nhánh exception trong validateVehicleForAvailability
        assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus("vehicleId123"));
    }

    @Test
    void createVehicle_WithPenalty_Success() {
        Penalty penalty = Penalty.builder().id("penaltyId").build();
        VehicleRentCreateDTO req = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("ABC-123")
                .vehicleType("CAR").penaltyId("penaltyId").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        when(penaltyRepository.findById("penaltyId")).thenReturn(Optional.of(penalty));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(req);
        assertNotNull(result);
    }

    @Test
    void createVehicle_PenaltyNotFound_ThrowsException() {
        VehicleRentCreateDTO req = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("ABC-123")
                .vehicleType("CAR").penaltyId("notfound").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
        when(penaltyRepository.findById("notfound")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(req));
        assertTrue(ex.getMessage().contains("Penalty not found"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseInsuranceStatus_InvalidAndNull_ReturnsNO() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertEquals(Vehicle.InsuranceStatus.NO, invokeParseInsuranceStatus(service, null));
        assertEquals(Vehicle.InsuranceStatus.NO, invokeParseInsuranceStatus(service, ""));
        assertEquals(Vehicle.InsuranceStatus.NO, invokeParseInsuranceStatus(service, "invalid"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseShipToAddress_InvalidAndNull_ReturnsNO() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertEquals(Vehicle.ShipToAddress.NO, invokeParseShipToAddress(service, null));
        assertEquals(Vehicle.ShipToAddress.NO, invokeParseShipToAddress(service, ""));
        assertEquals(Vehicle.ShipToAddress.NO, invokeParseShipToAddress(service, "invalid"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseTransmission_InvalidAndNull_ReturnsNull() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertNull(invokeParseTransmission(service, null));
        assertNull(invokeParseTransmission(service, ""));
        assertNull(invokeParseTransmission(service, "invalid"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseHaveDriver_InvalidAndNull_ReturnsNull() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertNull(invokeParseHaveDriver(service, null));
        assertNull(invokeParseHaveDriver(service, ""));
        assertNull(invokeParseHaveDriver(service, "invalid"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseFuelType_InvalidAndNull_ReturnsNull() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertNull(invokeParseFuelType(service, null));
        assertNull(invokeParseFuelType(service, ""));
        assertNull(invokeParseFuelType(service, "invalid"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseStatus_InvalidAndNull_ReturnsAVAILABLE() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertEquals(Vehicle.Status.AVAILABLE, invokeParseStatus(service, null));
        assertEquals(Vehicle.Status.AVAILABLE, invokeParseStatus(service, ""));
        assertEquals(Vehicle.Status.AVAILABLE, invokeParseStatus(service, "invalid"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void parseVehicleType_InvalidAndNull_ReturnsNull() {
        var service = new VehicleRentServiceImpl(vehicleRepository, brandRepository, modelRepository, userRepository, vehicleMapper, penaltyRepository);
        assertNull(invokeParseVehicleType(service, null));
        assertNull(invokeParseVehicleType(service, ""));
        assertNull(invokeParseVehicleType(service, "invalid"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void toggleVehicleStatus_Car_MissingFields_ThrowsException() {
        Vehicle car = Vehicle.builder().id("v1").user(mockUser).status(Vehicle.Status.UNAVAILABLE).vehicleType(Vehicle.VehicleType.CAR).build();
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(car));
        assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus("v1"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void toggleVehicleStatus_Motorbike_MissingFields_ThrowsException() {
        Vehicle mb = Vehicle.builder().id("v2").user(mockUser).status(Vehicle.Status.UNAVAILABLE).vehicleType(Vehicle.VehicleType.MOTORBIKE).build();
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mb));
        assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus("v2"));
    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void toggleVehicleStatus_Bicycle_MissingFields_ThrowsException() {
        Vehicle bc = Vehicle.builder().id("v3").user(mockUser).status(Vehicle.Status.UNAVAILABLE).vehicleType(Vehicle.VehicleType.BICYCLE).build();
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(bc));
        assertThrows(RuntimeException.class, () -> vehicleRentService.toggleVehicleStatus("v3"));
    }

    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void createVehicle_InvalidEnumFields_ThrowsExceptionForVehicleType() {
        VehicleRentCreateDTO req = VehicleRentCreateDTO.builder()
                .brandId("brand123").modelId("model456").licensePlate("ABC-123")
                .vehicleType("invalid") // chỉ trường này sẽ gây exception
                .insuranceStatus("invalid").shipToAddress("invalid")
                .transmission("invalid").fuelType("invalid").haveDriver("invalid").status("invalid")
                .build();
        when(userRepository.findById(anyString())).thenReturn(Optional.of(mockUser));
        assertThrows(RuntimeException.class, () -> vehicleRentService.createVehicle(req));
    }
//    @Test
//    void createVehicle_InvalidOtherEnumFields_DoesNotThrow() {
//        VehicleRentCreateDTO req = VehicleRentCreateDTO.builder()
//                .brandId("brand123").modelId("model456").licensePlate("ABC-123")
//                .vehicleType("CAR") // hợp lệ
//                .insuranceStatus("invalid").shipToAddress("invalid")
//                .transmission("invalid").fuelType("invalid").haveDriver("invalid").status("invalid")
//                .build();
//        when(userRepository.findById(anyString())).thenReturn(Optional.of(mockUser));
//        when(brandRepository.findById("brand123")).thenReturn(Optional.of(mockBrand));
//        when(modelRepository.findById("model456")).thenReturn(Optional.of(mockModel));
//        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
//        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
//        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
//        assertDoesNotThrow(() -> vehicleRentService.createVehicle(req));
//    }
    @Test
    @MockitoSettings(strictness = Strictness.LENIENT)
    void updateVehicle_InvalidEnumFields_DoesNotThrow() {
        when(vehicleRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(mockVehicle);
        when(vehicleRepository.findByIdWithBrandAndModel(anyString())).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(any(Vehicle.class))).thenReturn(mockVehicleGetDTO);
        VehicleRentUpdateDTO req = VehicleRentUpdateDTO.builder()
                .vehicleType("invalid").insuranceStatus("invalid").shipToAddress("invalid")
                .transmission("invalid").fuelType("invalid").haveDriver("invalid").status("invalid")
                .build();
        assertDoesNotThrow(() -> vehicleRentService.updateVehicle("vehicleId123", req));
    }

    // ========== HÀM HỖ TRỢ REFLECTION GỌI PRIVATE METHOD ========== 
    private Vehicle.InsuranceStatus invokeParseInsuranceStatus(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseInsuranceStatus", String.class); m.setAccessible(true); return (Vehicle.InsuranceStatus) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private Vehicle.ShipToAddress invokeParseShipToAddress(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseShipToAddress", String.class); m.setAccessible(true); return (Vehicle.ShipToAddress) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private Vehicle.Transmission invokeParseTransmission(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseTransmission", String.class); m.setAccessible(true); return (Vehicle.Transmission) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private Vehicle.HaveDriver invokeParseHaveDriver(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseHaveDriver", String.class); m.setAccessible(true); return (Vehicle.HaveDriver) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private Vehicle.FuelType invokeParseFuelType(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseFuelType", String.class); m.setAccessible(true); return (Vehicle.FuelType) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private Vehicle.Status invokeParseStatus(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseStatus", String.class); m.setAccessible(true); return (Vehicle.Status) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
    private Vehicle.VehicleType invokeParseVehicleType(VehicleRentServiceImpl service, String val) {
        try { var m = VehicleRentServiceImpl.class.getDeclaredMethod("parseVehicleType", String.class); m.setAccessible(true); return (Vehicle.VehicleType) m.invoke(service, val); } catch (Exception e) { throw new RuntimeException(e); }
    }
}