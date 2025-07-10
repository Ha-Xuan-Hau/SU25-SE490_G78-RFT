package com.rft.rft_be.service;

import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.VehicleImageDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.entity.Brand;
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
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
public class VehicleRentServiceTest {

    @Autowired
    private VehicleRentServiceImpl vehicleRentService;

    @MockBean
    private VehicleRepository vehicleRepository;
    @MockBean
    private BrandRepository brandRepository;
    @MockBean
    private ModelRepository modelRepository;
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private VehicleMapper vehicleMapper;

    private VehicleRentCreateDTO request;
    private VehicleGetDTO mockVehicleGetDTO;

    @BeforeEach
    void setUp() {
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
                .userId("testUserId")
                .brandId(request.getBrandId())
                .modelId(request.getModelId())
                .licensePlate(request.getLicensePlate())
                .vehicleType(request.getVehicleType())
                .vehicleFeatures(request.getVehicleFeatures())
                .vehicleImages(expectedVehicleImages)
                .haveDriver("NO")
                .insuranceStatus("NO")
                .shipToAddress("NO")
                .numberSeat(request.getNumberSeat())
                .yearManufacture(request.getYearManufacture())
                .transmission(request.getTransmission())
                .fuelType(request.getFuelType())
                .description(request.getDescription())
                .numberVehicle(request.getNumberVehicle())
                .costPerDay(request.getCostPerDay())
                .status("AVAILABLE")
                .thumb(request.getThumb())
                .totalRatings(0)
                .likes(0)
                .build();

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        JwtAuthenticationToken authentication = Mockito.mock(JwtAuthenticationToken.class);
        Jwt jwt = new Jwt(
            "token",
            null,
            null,
            Map.of("alg", "none"), // headers không rỗng
            Map.of("userId", "testUserId")
        );
        Mockito.when(authentication.getToken()).thenReturn(jwt);
        Mockito.when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Mock userRepository để luôn trả về user hợp lệ
        Mockito.when(userRepository.findById("testUserId"))
            .thenReturn(Optional.of(User.builder().id("testUserId").build()));
    }

    @Test
    void createVehicle_Motorbike_Success() {
        Brand brand = Brand.builder().id("brand123").build();
        Vehicle vehicle = Vehicle.builder().id("vehicleId123").build();
        when(brandRepository.findById("brand123")).thenReturn(Optional.of(brand));
        when(vehicleRepository.existsByLicensePlateAndUserId(anyString(), anyString())).thenReturn(false);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleRepository.findByIdWithBrandAndModel("vehicleId123")).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(mockVehicleGetDTO);
        VehicleGetDTO result = vehicleRentService.createVehicle(request);
        assertNotNull(result);
        assertEquals(mockVehicleGetDTO, result);
    }
}
