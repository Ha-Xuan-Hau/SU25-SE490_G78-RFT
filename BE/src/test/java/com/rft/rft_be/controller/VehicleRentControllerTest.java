//package com.rft.rft_be.controller;
//
//
//import com.rft.rft_be.controller.VehicleRentController;
//import com.rft.rft_be.dto.vehicle.vehicleRent.*;
//
//import com.rft.rft_be.dto.vehicle.*;
//import com.rft.rft_be.entity.Vehicle;
//import com.rft.rft_be.service.vehicleRent.VehicleRentService;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.MockitoAnnotations;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.Arrays;
//import java.util.List;
//import java.util.stream.Collectors;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.junit.jupiter.api.Assertions.assertNotNull;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.eq;
//import static org.mockito.Mockito.when;
//
//@SpringBootTest
//@AutoConfigureMockMvc
//public class VehicleRentControllerTest {
//
//
//    @Mock
//    private VehicleRentService vehicleRentService;
//
//    @InjectMocks
//    private VehicleRentController vehicleRentController;
//
//    @BeforeEach
//    void setUp() {
//        MockitoAnnotations.openMocks(this);
//    }
//
//    @Test
//    void registerVehicle_Success() {
//        // Given
//        String userId = "testUserId";
//        VehicleRentCreateDTO request = VehicleRentCreateDTO.builder()
//                .brandId("brand123")
//                .modelId("model456")
//                .licensePlate("ABC-123")
//                .vehicleType("CAR")
//                .vehicleFeatures("GPS, Bluetooth")
//                .vehicleImages("img1.jpg,img2.jpg")
//                .insuranceStatus("YES")
//                .shipToAddress("NO")
//                .numberSeat(5)
//                .yearManufacture(2022)
//                .transmission("AUTOMATIC")
//                .fuelType("GASOLINE")
//                .description("Một chiếc xe thoải mái.")
//                .numberVehicle(1)
//                .costPerDay(new BigDecimal("50.00"))
//                .thumb("thumb.jpg")
//                .build();
//
//        List<VehicleImageDTO> expectedVehicleImages;
//        String vehicleImagesString = request.getVehicleImages();
//        if (vehicleImagesString != null && !vehicleImagesString.isEmpty()) {
//            expectedVehicleImages = Arrays.stream(vehicleImagesString.split(","))
//                    .map(String::trim)
//                    .filter(s -> !s.isEmpty())
//                    .map(url -> VehicleImageDTO.builder().imageUrl(url).build())
//                    .collect(Collectors.toList());
//        } else {
//            expectedVehicleImages = List.of();
//        }
//
//        // --- Quan trọng: Đảm bảo TẤT CẢ các trường liên quan của VehicleGetDTO được điền đầy đủ
//        // để phép so sánh .equals() hoạt động chính xác.
//        // Ngay cả khi một số trường là null trong mock setup của bạn, nếu VehicleGetDTO thực tế được tạo bởi mapper
//        // điền các trường đó, thì .equals() sẽ thất bại.
//        // An toàn nhất là điền đầy đủ chúng hoặc sử dụng phương pháp so sánh tùy chỉnh nếu chỉ một tập hợp con các trường quan trọng.
//        VehicleGetDTO mockVehicleGetDTO = VehicleGetDTO.builder()
//                .id("vehicleId123")
//                .userId(userId)
//                // Giả sử VehicleGetDTO cũng có userName, brandName, modelName, v.v.
//                // Thêm các trường này nếu mapper thực tế của bạn điền chúng vào VehicleGetDTO
//                // .userName("Test User Name") // Ví dụ
//                .brandId(request.getBrandId())
//                // .brandName("Test Brand Name") // Ví dụ
//                .modelId(request.getModelId())
//                // .modelName("Test Model Name") // Ví dụ
//                // .penaltyId, .penaltyType, .penaltyValue, .minCancelHour - thiết lập nếu có, hoặc đảm bảo chúng cũng null trong DTO thực tế
//                .licensePlate(request.getLicensePlate())
//                .vehicleType(request.getVehicleType()) // Giả sử DTO sử dụng String cho enums
//                .vehicleFeatures(request.getVehicleFeatures())
//                .vehicleImages(expectedVehicleImages)
//                // Sử dụng .name() để lấy giá trị String từ enum, phù hợp với cách DTO thường lưu trữ
//                .haveDriver(Vehicle.HaveDriver.NO.name())
//                .insuranceStatus(Vehicle.InsuranceStatus.NO.name())
//                .shipToAddress(Vehicle.ShipToAddress.NO.name())
//                .numberSeat(request.getNumberSeat())
//                .yearManufacture(request.getYearManufacture())
//                .transmission(request.getTransmission()) // Giả sử DTO sử dụng String cho enums
//                .fuelType(request.getFuelType()) // Giả sử DTO sử dụng String cho enums
//                .description(request.getDescription())
//                .numberVehicle(request.getNumberVehicle())
//                .costPerDay(request.getCostPerDay())
//                .status(Vehicle.Status.AVAILABLE.name())
//                .thumb(request.getThumb())
//                .totalRatings(0)
//                .likes(0)
//                // createdAt và updatedAt thường được đặt bởi @CreationTimestamp/@UpdateTimestamp trong entity
//                // và có thể được bao gồm trong DTO. Nếu vậy, chúng cần được mock hoặc bỏ qua trong equals.
//                // Đối với unit test của controller, thường chỉ cần chúng không phải là null.
//                // Có thể thêm: .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()) nếu DTO của bạn có chúng.
//                .createdAt(LocalDateTime.now()) // Thêm để đảm bảo không null
//                .updatedAt(LocalDateTime.now()) // Thêm để đảm bảo không null
//                .build();
//
//        // Đảm bảo mock trả về một DTO không null
//        when(vehicleRentService.createVehicle(eq(userId), any(VehicleRentCreateDTO.class)))
//                .thenReturn(mockVehicleGetDTO); // Đảm bảo mockVehicleGetDTO thực sự được build và không null ở đây
//
//        // When
//        ResponseEntity<ApiResponseDTO<VehicleGetDTO>> responseEntity =
//                vehicleRentController.registerVehicle(userId, request);
//
//        // Then
//        assertNotNull(responseEntity);
//        // Thêm các assertion chi tiết hơn để xác định chính xác cái gì là null
//        assertNotNull(responseEntity.getBody(), "Response body của ResponseEntity không được null");
//        assertEquals(HttpStatus.CREATED, responseEntity.getStatusCode());
//        assertEquals("Vehicle registered successfully", responseEntity.getBody().getMessage());
//        assertNotNull(responseEntity.getBody().getData(), "Trường 'data' trong ApiResponseDTO không được null");
//        assertEquals(mockVehicleGetDTO, responseEntity.getBody().getData());
//    }
//
//    @Test
//    void registerVehicle_BadRequest() {
//        // Given
//        String userId = "testUserId";
//        VehicleRentCreateDTO request = VehicleRentCreateDTO.builder()
//                .brandId("brand123")
//                .modelId("model456")
//                .licensePlate("ABC-123")
//                .vehicleType("CAR")
//                .costPerDay(new BigDecimal("50.00"))
//                .build();
//
//        String errorMessage = "License plate already exists for this user";
//        when(vehicleRentService.createVehicle(eq(userId), any(VehicleRentCreateDTO.class)))
//                .thenThrow(new RuntimeException(errorMessage));
//
//        // When
//        ResponseEntity<ApiResponseDTO<VehicleGetDTO>> responseEntity =
//                vehicleRentController.registerVehicle(userId, request);
//
//        // Then
//        assertNotNull(responseEntity);
//        assertEquals(HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());
//        assertNotNull(responseEntity.getBody());
//        assertEquals("Failed to register vehicle: " + errorMessage, responseEntity.getBody().getMessage());
//        // Giả sử ApiResponseDTO có trường getSuccess()
//        assertEquals(false, responseEntity.getBody().isSuccess());
//    }
//}
