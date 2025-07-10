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
}
