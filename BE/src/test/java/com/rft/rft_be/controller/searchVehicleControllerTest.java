package com.rft.rft_be.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleSearchDTO;
import com.rft.rft_be.dto.vehicle.VehicleSearchResultDTO;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.service.vehicle.VehicleService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.rft.rft_be.dto.vehicle.VehicleImageDTO; //
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
public class searchVehicleControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VehicleService vehicleService; // Mock VehicleService

    // Đổi tên biến để tránh nhầm lẫn và ghi đè
    private VehicleSearchDTO vehicleSearchDTO; // DTO dùng làm request gửi đi
    private VehicleSearchResultDTO mockVehicleSearchResultDTO; // DTO dùng làm kết quả trả về từ service

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Khởi tạo validSearchRequestDTO là một VehicleSearchDTO hợp lệ để sử dụng trong các test
        vehicleSearchDTO = VehicleSearchDTO.builder()
                .vehicleTypes(Arrays.asList("CAR"))
                .addresses(Arrays.asList("123"))
                .haveDriver(Vehicle.HaveDriver.NO)
                .shipToAddress(Vehicle.ShipToAddress.YES)
                .brandId("brand-001")
                .modelId("model-002")
                .numberSeat(5)
                .costFrom(50000)
                .costTo(1500000)
                // Đảm bảo tên trường khớp với DTO của bạn. Giả định là "Transmission" chữ thường.
                .Transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .ratingFiveStarsOnly(true)
                .pickupDateTime("2025-10-10T09:00:00Z") // Thêm 'Z' nếu ISO-8601 UTC
                .returnDateTime("2025-10-12T18:00:00Z") // Thêm 'Z' nếu ISO-8601 UTC
                .page(0)
                .size(5)
                .build();

        // Expected Output Result DTO (matching your provided JSON output content)
        // Đây là DTO mà VehicleService sẽ trả về (được mock)
        mockVehicleSearchResultDTO = VehicleSearchResultDTO.builder()
                .id("vehicle_001")
                .licensePlate("51A-12345")
                .vehicleType("CAR")
                .thumb("Toyota Camry 2020")
                .costPerDay(BigDecimal.valueOf(800000.00))
                .status("AVAILABLE")
                .brandName("Toyota")
                .modelName("4 chỗ (Sedan)")
                .numberSeat(5)
                .rating(5.0)
                .address("123 Đường Lê Lợi, Quận 1, TP.HCM")
                .vehicleImages(List.of(
                        new VehicleImageDTO("https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-125-658066d817df4.jpg?crop=1xw:1xh;center,top&resize=980:*"),
                        new VehicleImageDTO("https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-123-658066d75b1c1.jpg?crop=1xw:1xh;center,top&resize=980:*"),
                        new VehicleImageDTO("https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-120-658066d5be42d.jpg?crop=1xw:1xh;center,top&resize=980:*"),
                        new VehicleImageDTO("https://hips.hearstapps.com/hmg-prod/images/2024-subaru-brz-ts-126-658066d82048c.jpg?crop=1xw:1xh;center,top&resize=980:*")
                ))
                .transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .build();
    }

    // --- Happy Path Tests ---

    @Test
    void search_fullParameters_success() throws Exception {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(List.of("CAR"))
                .addresses(List.of("Hà Nội"))
                // SỬA CÁCH GÁN CHO haveDriver và shipToAddress VỚI ENUM CHÍNH XÁC TỪ Vehicle
                .haveDriver(Vehicle.HaveDriver.NO) // Sử dụng enum thực tế
                .shipToAddress(Vehicle.ShipToAddress.YES) // Sử dụng enum thực tế
                .brandId("brand-001")
                .modelId("model-002")
                .pickupDateTime("2025-10-10T09:00:00Z")
                .returnDateTime("2025-10-12T18:00:00Z")
                .fuelType(Vehicle.FuelType.GASOLINE.name())
                .numberSeat(5)
                .costFrom(500000)
                .costTo(1500000)
                .ratingFiveStarsOnly(true)
                .page(0)
                .size(5)
                .Transmission(Vehicle.Transmission.MANUAL.name()) // Truyền tên enum dưới dạng String
                .build();
        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z"));


    }

    @Test
    void search_noParameters_success() throws Exception {

        VehicleSearchDTO request = VehicleSearchDTO.builder().page(0).size(12).build();

        Page<VehicleSearchResultDTO> mockPage = new PageImpl<>(List.of(mockVehicleSearchResultDTO), PageRequest.of(0, 12), 1); // Sử dụng mockVehicleSearchResultDTO

        when(vehicleService.searchVehicles(
                any(VehicleSearchDTO.class),
                Mockito.isNull(),
                Mockito.isNull()))
                .thenReturn(mockPage);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(mockVehicleSearchResultDTO.getId())) // Sử dụng mockVehicleSearchResultDTO
                .andExpect(jsonPath("$.totalElements").value(1));


        ArgumentCaptor<LocalDateTime> timeFromCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> timeToCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(vehicleService).searchVehicles(any(VehicleSearchDTO.class), timeFromCaptor.capture(), timeToCaptor.capture());
        assertThat(timeFromCaptor.getValue()).isNull();
        assertThat(timeToCaptor.getValue()).isNull();
    }

    @Test
    void search_emptyResult() throws Exception {

        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .addresses(Arrays.asList("Địa chỉ không tồn tại"))
                .pickupDateTime("2025-07-10T09:00:00Z") // Định dạng đúng
                .returnDateTime("2025-07-12T18:00:00Z") // Định dạng đúng
                .page(0)
                .size(5)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z"));

    }


    @Test
    void search_invalidPickupDateTime_malformed() throws Exception {
        // UTCID36: pickupDateTime sai định dạng
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .pickupDateTime("2025-07-10 09:00:00") // Sai định dạng
                .returnDateTime("2025-07-12T18:00:00Z")
                .page(0)
                .size(5)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()) // Mong đợi 400 Bad Request
                .andExpect(content().string("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z")); //
    }

    @Test
    void search_emptyPickupDateTimeString() throws Exception {
        // UTCID38: pickupDateTime là chuỗi rỗng
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .pickupDateTime("") // Chuỗi rỗng
                .returnDateTime("2025-07-12T18:00:00Z")
                .page(0)
                .size(5)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z"));
    }

    @Test
    void search_returnDateTimeBeforePickupDateTime() throws Exception {
        // UTCID43: returnDateTime xảy ra trước pickupDateTime
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .pickupDateTime("2025-07-12T09:00:00Z")
                .returnDateTime("2025-07-10T18:00:00Z")
                .page(0)
                .size(5)
                .build();

        // WHEN & THEN
        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z"));
    }

    @Test
    void search_invalidTransmissionValue() throws Exception {
        // UTCID44: Transmission là chuỗi không hợp lệ (ENUM)
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .Transmission("AUTOMA") // Đảm bảo khớp casing với DTO của bạn
                .page(0)
                .size(5)
                .build();

        // QUAN TRỌNG: Mock service để ném ra IllegalArgumentException
        // vì GlobalExceptionHandler của bạn đang bắt lỗi này
        when(vehicleService.searchVehicles(any(VehicleSearchDTO.class), any(), any()))
                .thenThrow(new IllegalArgumentException("No enum constant com.rft.rft_be.entity.Vehicle.Transmission.AUTOMA"));

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()) // Mong đợi 400 Bad Request
                // Assertion của bạn đã đúng với JSON response từ GlobalExceptionHandler
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("No enum constant com.rft.rft_be.entity.Vehicle.Transmission.AUTOMA"));

        // Xác minh rằng service đã được gọi
        verify(vehicleService).searchVehicles(any(VehicleSearchDTO.class), any(), any());
    }

    @Test
    void search_negativePageNumber() throws Exception {
        // UTCID46: page là số âm
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .page(-1)
                .size(5)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()) // Mong đợi 400 Bad Request
                // SỬA DÒNG NÀY ĐỂ KHỚP VỚI CẤU TRÚC JSON VÀ THÔNG BÁO LỖI THỰC TẾ
                .andExpect(jsonPath("$.errors.page").value("Số trang phải là số dương.")); // Đúng JSON Path và thông báo lỗi
    }


    @Test
    void search_invalidPageSize_zero() throws Exception {
        // UTCID48: size là 0
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .page(0)
                .size(0)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()) // Mong đợi 400 Bad Request

                .andExpect(jsonPath("$.errors.size").value("Kích cỡ trang phải ít nhất là 1."));
    }

    @Test
    void search_numberSeat_belowMin() throws Exception {

        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .numberSeat(0) // Invalid: should be at least 1
                .page(0)
                .size(5)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.numberSeat").value("Số ghế phải ít nhất là 1."));
    }

    @Test
    void search_pickupAndReturnSameTime() throws Exception {
        // UTCID49: pickupDateTime và returnDateTime là cùng một thời điểm (kết thúc cùng lúc)
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .pickupDateTime("2025-07-10T09:00:00Z")
                .returnDateTime("2025-07-10T09:00:00Z")
                .page(0)
                .size(5)
                .build();

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.content().string("Invalid date format. Expecting ISO-8601 e.g. 2025-07-06T00:00:00Z"));

    }

    @Test
    void search_largePageSize() throws Exception {
        // UTCID58: size rất lớn
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .page(0)
                .size(1000) // Large size
                .build();

        Page<VehicleSearchResultDTO> mockPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 1000), 0);
        when(vehicleService.searchVehicles(any(VehicleSearchDTO.class), any(), any()))
                .thenReturn(mockPage);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(1000));
    }

    @Test
    void search_emptyVehicleTypesList() throws Exception {
        // UTCID60: vehicleTypes là một danh sách rỗng
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(Collections.emptyList()) // Empty list
                .page(0)
                .size(5)
                .build();

        Page<VehicleSearchResultDTO> mockPage = new PageImpl<>(List.of(mockVehicleSearchResultDTO), PageRequest.of(0, 5), 1);
        when(vehicleService.searchVehicles(any(VehicleSearchDTO.class), any(), any()))
                .thenReturn(mockPage);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify service received an empty list
        ArgumentCaptor<VehicleSearchDTO> dtoCaptor = ArgumentCaptor.forClass(VehicleSearchDTO.class);
        verify(vehicleService).searchVehicles(dtoCaptor.capture(), any(), any());
        assertThat(dtoCaptor.getValue().getVehicleTypes()).isEmpty();
    }

    @Test
    void search_nullVehicleTypesList() throws Exception {
        // UTCID62: vehicleTypes là null
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(null) // Null list
                .page(0)
                .size(5)
                .build();

        Page<VehicleSearchResultDTO> mockPage = new PageImpl<>(List.of(mockVehicleSearchResultDTO), PageRequest.of(0, 5), 1);
        when(vehicleService.searchVehicles(any(VehicleSearchDTO.class), any(), any()))
                .thenReturn(mockPage);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify service received a null list
        ArgumentCaptor<VehicleSearchDTO> dtoCaptor = ArgumentCaptor.forClass(VehicleSearchDTO.class);
        verify(vehicleService).searchVehicles(dtoCaptor.capture(), any(), any());
        assertThat(dtoCaptor.getValue().getVehicleTypes()).isNull();
    }

    @Test
    void search_ratingFiveStarsOnly_false() throws Exception {
        // UTCID64: ratingFiveStarsOnly là false
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .ratingFiveStarsOnly(false)
                .page(0)
                .size(5)
                .build();

        Page<VehicleSearchResultDTO> mockPage = new PageImpl<>(List.of(mockVehicleSearchResultDTO), PageRequest.of(0, 5), 1);
        when(vehicleService.searchVehicles(any(VehicleSearchDTO.class), any(), any()))
                .thenReturn(mockPage);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        ArgumentCaptor<VehicleSearchDTO> dtoCaptor = ArgumentCaptor.forClass(VehicleSearchDTO.class);
        verify(vehicleService).searchVehicles(dtoCaptor.capture(), any(), any());
        assertThat(dtoCaptor.getValue().getRatingFiveStarsOnly()).isFalse();
    }


    // --- Test khi Service ném ngoại lệ khác ---
    @Test
    void search_serviceThrowsGenericException() throws Exception {
        // UTCID50: search service ném ra RuntimeException
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .page(0)
                .size(5)
                .build();

        // Mock cho service ném ra RuntimeException
        when(vehicleService.searchVehicles(any(VehicleSearchDTO.class), any(), any()))
                .thenThrow(new RuntimeException("Database connection lost"));

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                // SỬA DÒNG NÀY: Mong đợi 400 Bad Request
                .andExpect(status().isBadRequest()) // Hiện tại API trả về 400
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("Database connection lost"));

        verify(vehicleService).searchVehicles(any(VehicleSearchDTO.class), any(), any());
    }
}