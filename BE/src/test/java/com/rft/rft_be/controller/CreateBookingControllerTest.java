package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.service.booking.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser; // Import this
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors; // Import this
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders; // Import this
import org.springframework.test.web.servlet.result.MockMvcResultMatchers; // Import this
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@AutoConfigureMockMvc
public class CreateBookingControllerTest {


    @Autowired
    private MockMvc mockMvc;


    @Autowired
    private ObjectMapper objectMapper; // Này sẽ được tùy chỉnh bởi JacksonTestConfig

    @MockBean
    private BookingService bookingService;

    private JwtAuthenticationToken mockJwtAuthenticationToken;
    private final String testUserId = "user_003";
    private final String vehicleOwnerId = "user_001";
    private final String vehicleId = "vehicle_001";

    private final LocalDateTime FIXED_DATE_TIME = LocalDateTime.of(2027, 9, 1, 10, 0, 0, 0);

    @TestConfiguration
    static class JacksonTestConfig {
        @Bean
        public ObjectMapper objectMapper() {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            return mapper;
        }
    }

    // @Autowired WebApplicationContext để setup MockMvc thủ công
    @Autowired
    private WebApplicationContext webApplicationContext;

    @BeforeEach
    void setUp() {

        Jwt jwt = new Jwt(
                "tokenString",
                LocalDateTime.now().minusHours(1).toInstant(ZoneOffset.UTC),
                LocalDateTime.now().plusHours(1).toInstant(ZoneOffset.UTC),
                Map.of("alg", "RS256"),
                Map.of("sub", "subject", "userId", testUserId)
        );
        mockJwtAuthenticationToken = new JwtAuthenticationToken(jwt, Collections.singletonList(new SimpleGrantedAuthority("SCOPE_user")));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_ShouldReturnCreatedStatus_WhenBookingIsSuccessful() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        // timeBookingStart và timeBookingEnd từ Postman input của bạn
        request.setTimeBookingStart(LocalDateTime.of(2027, 9, 21, 10, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2027, 9, 23, 10, 0));
        request.setPhoneNumber("0989092096");
        request.setAddress("127 Võ Thị Sáu, Quận 4, TP.HCM");
        request.setPenaltyType("PERCENT");
        request.setPenaltyValue(BigDecimal.valueOf(10));
        request.setMinCancelHour(48);
        request.setPickupMethod("office"); // Đảm bảo trường này có trong DTO nếu bạn đặt nó

        // Prepare mock response from BookingService (Cập nhật để khớp với log)
        BookingResponseDTO mockResponse = BookingResponseDTO.builder()
                .id("3c876a42-a799-40ec-8092-309998847f65")
                .user(UserProfileDTO.builder()
                        .id(testUserId)
                        .fullName("Lê Văn Cường")
                        .profilePicture("https://example.com/avatar3.jpg")
                        .dateOfBirth(LocalDate.of(1995, 12, 10))
                        .phone("0901234567")
                        .address("789 Đường Võ Văn Tần, Quận 5, TP.HCM")
                        .build())
                .vehicle(VehicleForBookingDTO.builder()
                        .id(vehicleId)
                        .user(UserProfileDTO.builder()
                                .id(vehicleOwnerId)
                                .fullName("Nguyễn Văn An")
                                .profilePicture("https://example.com/avatar1.jpg")
                                .dateOfBirth(LocalDate.of(1985, 3, 15))
                                .phone("0912345678")
                                .address("123 Đường Lê Lợi, Quận 1, TP.HCM")
                                .build())
                        .licensePlate("51A-12345")
                        .vehicleTypes("CAR")
                        .thumb("Toyota Camry 2020")
                        .costPerDay(BigDecimal.valueOf(800000.00))
                        .status("AVAILABLE")
                        .build())
                .timeBookingStart(request.getTimeBookingStart())
                .timeBookingEnd(request.getTimeBookingEnd())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .totalCost(BigDecimal.valueOf(1600000.0)) // Từ Postman output
                .status(Booking.Status.UNPAID)
                .codeTransaction("BOOK-E833CE8A") // Từ Postman output
                .timeTransaction(FIXED_DATE_TIME) // Sử dụng FIXED_DATE_TIME đã cập nhật
                .penaltyType(String.valueOf(Booking.PenaltyType.PERCENT))
                .penaltyValue(request.getPenaltyValue())
                .minCancelHour(request.getMinCancelHour())
                .couponId(null)
                .createdAt(FIXED_DATE_TIME) // Sử dụng FIXED_DATE_TIME đã cập nhật
                .updatedAt(FIXED_DATE_TIME) // Sử dụng FIXED_DATE_TIME đã cập nhật
                .priceType("daily")
                .rentalDuration("2 ngày")
                .discountAmount(null)
                .build();

        // WHEN
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenReturn(mockResponse);

        // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)) // Request body có định dạng mảng số, khớp với input Postman
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(mockResponse.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.user.id").value(testUserId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.user.fullName").value("Lê Văn Cường"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.vehicle.id").value(vehicleId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.vehicle.user.id").value(vehicleOwnerId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.totalCost").value(1600000.0))
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("UNPAID"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.codeTransaction").value("BOOK-E833CE8A"))

                // Thay đổi các assertion cho LocalDateTime để chỉ kiểm tra 5 phần tử (năm, tháng, ngày, giờ, phút)
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingStart[0]").value(request.getTimeBookingStart().getYear()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingStart[1]").value(request.getTimeBookingStart().getMonthValue()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingStart[2]").value(request.getTimeBookingStart().getDayOfMonth()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingStart[3]").value(request.getTimeBookingStart().getHour()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingStart[4]").value(request.getTimeBookingStart().getMinute()))

                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingEnd[0]").value(request.getTimeBookingEnd().getYear()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingEnd[1]").value(request.getTimeBookingEnd().getMonthValue()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingEnd[2]").value(request.getTimeBookingEnd().getDayOfMonth()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingEnd[3]").value(request.getTimeBookingEnd().getHour()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeBookingEnd[4]").value(request.getTimeBookingEnd().getMinute()))

                .andExpect(MockMvcResultMatchers.jsonPath("$.timeTransaction[0]").value(FIXED_DATE_TIME.getYear()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeTransaction[1]").value(FIXED_DATE_TIME.getMonthValue()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeTransaction[2]").value(FIXED_DATE_TIME.getDayOfMonth()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeTransaction[3]").value(FIXED_DATE_TIME.getHour()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.timeTransaction[4]").value(FIXED_DATE_TIME.getMinute()))
                // Bỏ .jsonPath("$.timeTransaction[5]") và [6] vì output chỉ có 5 phần tử.

                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt[0]").value(FIXED_DATE_TIME.getYear()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt[1]").value(FIXED_DATE_TIME.getMonthValue()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt[2]").value(FIXED_DATE_TIME.getDayOfMonth()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt[3]").value(FIXED_DATE_TIME.getHour()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt[4]").value(FIXED_DATE_TIME.getMinute()))
                // Bỏ .jsonPath("$.createdAt[5]") và [6].

                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt[0]").value(FIXED_DATE_TIME.getYear()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt[1]").value(FIXED_DATE_TIME.getMonthValue()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt[2]").value(FIXED_DATE_TIME.getDayOfMonth()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt[3]").value(FIXED_DATE_TIME.getHour()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt[4]").value(FIXED_DATE_TIME.getMinute()))
                // Bỏ .jsonPath("$.updatedAt[5]") và [6].

                .andExpect(MockMvcResultMatchers.jsonPath("$.penaltyType").value("PERCENT"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.penaltyValue").value(10.0))
                .andExpect(MockMvcResultMatchers.jsonPath("$.minCancelHour").value(48))
                .andExpect(MockMvcResultMatchers.jsonPath("$.priceType").value("daily"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.rentalDuration").value("2 ngày"));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }


    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_ShouldReturnBadRequestStatus_WhenInvalidBookingTime() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 10, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 9, 0)); // End before Start
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String errorMessage = "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc.";
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage));

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(400))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(errorMessage)); // Corrected jsonPath

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_ShouldReturnNotFoundStatus_WhenUserNotFound() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String errorMessage = "Không tìm thấy người dùng với ID: " + testUserId;
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, errorMessage));

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(404))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(errorMessage)); // Corrected jsonPath

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_ShouldReturnNotFoundStatus_WhenVehicleIdNotFoundInService() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId("non-existent-vehicle-id");
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String errorMessage = "Không tìm thấy xe";
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, errorMessage));

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(404))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(errorMessage)); // Corrected jsonPath

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_ShouldReturnBadRequest_WhenVehicleIdIsMissing() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        // vehicleId is null
        request.setTimeBookingStart(LocalDateTime.of(2025, 9, 1, 10, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 9, 5, 10, 0));
        request.setPhoneNumber("0989092096");
        request.setAddress("12 Võ Thị Sáu, Quận 4, TP.HCM");
        request.setPickupMethod("office");
        request.setPenaltyType("PERCENT");
        request.setPenaltyValue(BigDecimal.valueOf(10));
        request.setMinCancelHour(48);


        String expectedErrorMessage = "vehicleId không được phép trống";

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                // For validation errors, the response body usually contains an "errors" map
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.vehicleId").value(expectedErrorMessage));
        // No verify(bookingService) here because @Valid happens before service call
    }


    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC2_ShouldReturnConflict_WhenVehicleAlreadyBooked() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String errorMessage = "Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác.";
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, errorMessage));

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isConflict())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(409))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(errorMessage)); // Corrected jsonPath

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC3_ShouldReturnBadRequest_WhenPhoneNumberIsEmpty() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setAddress("123 Example Street");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);
        request.setPickupMethod("office");

        // WHEN & THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.phoneNumber").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.phoneNumber").value("Số điện thoại không được phép trống."));
    }


    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC4_ShouldReturnBadRequest_WhenTimeBookingStartIsNull() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(null); // Null start time
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String expectedErrorMessage = "Thời gian bắt đầu không được phép trống."; // Assuming @NotNull message

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.timeBookingStart").value(expectedErrorMessage)); // Corrected jsonPath
        // No verify(bookingService) here because @Valid happens before service call
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC5_ShouldReturnBadRequest_WhenTimeBookingEndIsNull() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(null); // Null end time
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String expectedErrorMessage = "Thời gian kết thúc không được phép trống."; // Assuming @NotNull message

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.timeBookingEnd").value(expectedErrorMessage)); // Corrected jsonPath
        // No verify(bookingService) here because @Valid happens before service call
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC6_ShouldReturnBadRequest_WhenPhoneNumberIsInvalidFormat() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("_@123"); // Invalid format
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String expectedErrorMessage = "Số điện thoại không đúng định dạng"; // Assuming @Pattern message

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.phoneNumber").value(expectedErrorMessage)); // Corrected jsonPath
        // No verify(bookingService) here because @Valid happens before service call
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC7_ShouldReturnForbidden_WhenUserTriesToBookOwnVehicle() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId("vehicle-owned-by-test-user");
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String errorMessage = "Người dùng không được phép đặt xe của chính mình";
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, errorMessage));

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isForbidden())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(403))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(errorMessage)); // Corrected jsonPath

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createBooking_TC8_ShouldReturnBadRequest_WhenBookingTimeIsInvalidOrder() throws Exception {
        // GIVEN
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 10, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 9, 0)); // End before Start
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        String errorMessage = "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc.";
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage));

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings") // Corrected URL
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .with(SecurityMockMvcRequestPostProcessors.authentication(mockJwtAuthenticationToken)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value(400))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value(errorMessage)); // Corrected jsonPath

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }
}