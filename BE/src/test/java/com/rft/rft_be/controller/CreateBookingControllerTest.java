package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature; // Import this
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule; // Import this
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate; // Import this
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter; // Import this
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CreateBookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService; // Mock BookingService

    private JwtAuthenticationToken mockJwtAuthenticationToken;
    private String testUserId = "user_003"; // Thay đổi để khớp với user_003 trong output
    private String vehicleOwnerId = "user_001"; // ID của chủ xe
    private String vehicleId = "vehicle_001"; // ID của xe

    @BeforeEach
    void setUp() {
        // Cần đăng ký JavaTimeModule để ObjectMapper xử lý LocalDateTime
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());


        Jwt jwt = new Jwt(
                "tokenString", // Token value
                LocalDateTime.now().minusHours(1).toInstant(java.time.ZoneOffset.UTC), // Issued at
                LocalDateTime.now().plusHours(1).toInstant(java.time.ZoneOffset.UTC),  // Expires at
                Map.of("alg", "RS256"), // Headers
                Map.of("sub", "subject", "userId", testUserId) // Claims, bao gồm userId
        );
        mockJwtAuthenticationToken = new JwtAuthenticationToken(jwt, Collections.singletonList(new SimpleGrantedAuthority("SCOPE_user")));
    }

    @Test
    void createBooking_ShouldReturnCreatedStatus_WhenBookingIsSuccessful() throws Exception {

        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2027, 9, 1, 10, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2027, 9, 5, 10, 0));
        request.setPhoneNumber("0989092096");
        request.setAddress("12 Võ Thị Sáu, Quận 4, TP.HCM");
        request.setPenaltyType("PERCENT");
        request.setPenaltyValue(BigDecimal.valueOf(10));
        request.setMinCancelHour(48);


        LocalDateTime now = LocalDateTime.now(); // Sử dụng thời gian hiện tại để khớp với timeTransaction/createdAt/updatedAt

        // Prepare mock response from BookingService to match the valid output
        BookingResponseDTO mockResponse = BookingResponseDTO.builder()
                .id("7da6389b-bad7-4131-8088-6a20d7a2a50b")
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
                        .user(UserProfileDTO.builder() // Nested user for vehicle owner
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
                .totalCost(BigDecimal.valueOf(3200000.00)) // Match exact totalCost from output
                .status(Booking.Status.UNPAID)
                .codeTransaction("BOOK-2408C07F") // Match exact codeTransaction from output
                .timeTransaction(now) // Use 'now' to match createdAt/updatedAt
                .penaltyType(String.valueOf(Booking.PenaltyType.PERCENT)) // Assuming this is an enum
                .penaltyValue(request.getPenaltyValue())
                .minCancelHour(request.getMinCancelHour())
                .couponId(null)
                .createdAt(now)
                .updatedAt(now)
                .priceType("daily") // Match priceType from output
                .rentalDuration("4 ngày") // Match rentalDuration from output
                .discountAmount(null)
                .build();

        // 3. Stub BookingService method
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenReturn(mockResponse);

        // 4. Perform POST request
        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken)) // Add JWT authentication
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()) // Expect HTTP 201 Created
                .andExpect(jsonPath("$.id").value(mockResponse.getId()))
                .andExpect(jsonPath("$.user.id").value(testUserId))
                .andExpect(jsonPath("$.user.fullName").value("Lê Văn Cường"))
                .andExpect(jsonPath("$.vehicle.id").value(vehicleId))
                .andExpect(jsonPath("$.vehicle.user.id").value(vehicleOwnerId)) // Verify vehicle owner ID
                .andExpect(jsonPath("$.totalCost").value(3200000.00))
                .andExpect(jsonPath("$.status").value("UNPAID"))
                .andExpect(jsonPath("$.codeTransaction").value("BOOK-2408C07F"))
                .andExpect(jsonPath("$.timeBookingStart").value("2027-09-01T10:00:00"))
                .andExpect(jsonPath("$.timeBookingEnd").value("2027-09-05T10:00:00"))
                .andExpect(jsonPath("$.timeTransaction").exists())
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.penaltyType").value("PERCENT"))
                .andExpect(jsonPath("$.penaltyValue").value(10))
                .andExpect(jsonPath("$.minCancelHour").value(48))
                .andExpect(jsonPath("$.priceType").value("daily"))
                .andExpect(jsonPath("$.rentalDuration").value("4 ngày"));

        // 5. Verify that bookingService.createBooking was called
        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_ShouldReturnBadRequestStatus_WhenInvalidBookingTime() throws Exception {
        // 1. Prepare request DTO with invalid time
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

        // 2. Stub BookingService to throw ResponseStatusException for bad request
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc."));

        // 3. Perform POST request
        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()) // Expect HTTP 400 Bad Request
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc."));

        // 4. Verify that bookingService.createBooking was called
        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_ShouldReturnNotFoundStatus_WhenUserNotFound() throws Exception {
        // 1. Prepare request DTO
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

        // 2. Stub BookingService to throw ResponseStatusException for not found user
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + testUserId));

        // 3. Perform POST request
        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound()) // Expect HTTP 404 Not Found
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Không tìm thấy người dùng với ID: " + testUserId));

        // 4. Verify that bookingService.createBooking was called
        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_ShouldReturnNotFoundStatus_WhenVehicleIdNotFoundInService() throws Exception {
        // 1. Prepare request DTO with a non-existent vehicleId
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId("non-existent-vehicle-id"); // Vehicle ID không tồn tại
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        // 2. Stub BookingService to throw ResponseStatusException with NOT_FOUND status
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe"));

        // 3. Perform POST request
        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound()) // Expect HTTP 404 Not Found
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Không tìm thấy xe"));

        // 4. Verify that bookingService.createBooking was called
        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_ShouldReturnBadRequest_WhenVehicleIdIsMissing() throws Exception {
        // 1. Prepare request DTO WITHOUT setting vehicleId field
        BookingRequestDTO request = new BookingRequestDTO();
        // Do NOT set request.setVehicleId("some-id"); // vehicleId will be null
        request.setTimeBookingStart(LocalDateTime.of(2025, 9, 1, 10, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 9, 5, 10, 0));
        request.setPhoneNumber("0989092096");
        request.setAddress("12 Võ Thị Sáu, Quận 4, TP.HCM");
        request.setPickupMethod("office");
        request.setPenaltyType("PERCENT");
        request.setPenaltyValue(BigDecimal.valueOf(10));
        request.setMinCancelHour(48);

        // 2. Stub BookingService to throw an exception that results in "The given id must not be null"
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "The given id must not be null"));

        // 3. Perform POST request
        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("The given id must not be null"));

        // 4. Verify that bookingService.createBooking was called
        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC2_ShouldReturnConflict_WhenVehicleAlreadyBooked() throws Exception {
        // TC2: "Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác."
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

        // Mock BookingService to throw Conflict (HTTP 409)
        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác."));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác."));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC3_ShouldReturnBadRequest_WhenPhoneNumberIsEmpty() throws Exception {
        // TC3: "Số điện thoại không được phép trống."
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber(""); // Empty phone number
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không được phép trống."));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Số điện thoại không được phép trống."));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC4_ShouldReturnBadRequest_WhenTimeBookingStartIsNull() throws Exception {
        // TC4: "Thời gian bắt đầu không được phép trống."
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

        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian bắt đầu không được phép trống."));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Thời gian bắt đầu không được phép trống."));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC5_ShouldReturnBadRequest_WhenTimeBookingEndIsNull() throws Exception {
        // TC5: "Thời gian kết thúc không được phép trống."
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

        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc không được phép trống."));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Thời gian kết thúc không được phép trống."));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC6_ShouldReturnBadRequest_WhenPhoneNumberIsInvalidFormat() throws Exception {
        // TC6: "Số điện thoại không đúng định dạng."
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId(vehicleId);
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("123"); // Invalid format
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không đúng định dạng."));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Số điện thoại không đúng định dạng."));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC7_ShouldReturnForbidden_WhenUserTriesToBookOwnVehicle() throws Exception {
        // TC7: "Người dùng không được phép đặt xe của chính mình"
        // Để test case này, chúng ta cần một `vehicleId` mà `BookingService` sẽ nhận ra là thuộc về `testUserId`.
        // Mock service để ném ra FORBIDDEN (HTTP 403)
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleId("vehicle-owned-by-test-user"); // Giả định ID này thuộc về testUserId
        request.setTimeBookingStart(LocalDateTime.of(2025, 7, 15, 9, 0));
        request.setTimeBookingEnd(LocalDateTime.of(2025, 7, 15, 12, 0));
        request.setPhoneNumber("0987654321");
        request.setAddress("123 Example Street");
        request.setPickupMethod("office");
        request.setPenaltyType("FIXED_AMOUNT");
        request.setPenaltyValue(BigDecimal.valueOf(50000));
        request.setMinCancelHour(24);

        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Người dùng không được phép đặt xe của chính mình"));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden()) // Expect HTTP 403 Forbidden
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Người dùng không được phép đặt xe của chính mình"));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }

    @Test
    void createBooking_TC8_ShouldReturnBadRequest_WhenBookingTimeIsInvalidOrder() throws Exception {
        // TC8: "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc."
        // Test case này đã được bao phủ bởi `createBooking_ShouldReturnBadRequestStatus_WhenInvalidBookingTime` ở trên,
        // nhưng tôi sẽ tạo một bản sao với tên rõ ràng hơn để khớp với TC8.
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

        Mockito.when(bookingService.createBooking(any(BookingRequestDTO.class), eq(testUserId)))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc."));

        mockMvc.perform(post("/api/booking/createBooking")
                        .with(authentication(mockJwtAuthenticationToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc."));

        Mockito.verify(bookingService).createBooking(any(BookingRequestDTO.class), eq(testUserId));
    }
}