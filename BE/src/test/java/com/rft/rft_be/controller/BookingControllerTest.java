package com.rft.rft_be.controller;


import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.booking.CancelBookingResponseDTO;
import com.rft.rft_be.service.booking.BookingService;
import org.junit.jupiter.api.BeforeEach;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private JwtDecoder jwtDecoder; // ✅ Bổ sung khai báo

    private static final String TOKEN = "mock-token";

    @BeforeEach
    void setupSecurityContext() {
        Jwt jwt = Jwt.withTokenValue(TOKEN)
                .header("alg", "none")
                .claim("userId", "mock-user-id")
                .subject("mock-user-id")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .claims(claims -> claims.put("scope", "booking:confirm"))
                .build();

        JwtAuthenticationToken auth = new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("SCOPE_booking:confirm")),
                "mock-user-id"
        );

        SecurityContextHolder.setContext(new SecurityContextImpl(auth));

        // ✅ mock JwtDecoder để không decode thật token
        Mockito.when(jwtDecoder.decode(TOKEN)).thenReturn(jwt);
    }

    @Test
    void testConfirmBooking_success() throws Exception {
        Mockito.doNothing().when(bookingService).confirmBooking("booking123", TOKEN);

        mockMvc.perform(post("/api/bookings/booking123/confirm")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication())))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain; charset=UTF-8"))
                .andExpect(content().string("Xác nhận đơn thành công"));
    }

    @Test
    void testDeliverVehicle_success() throws Exception {
        Mockito.doNothing().when(bookingService).deliverVehicle("booking123", TOKEN);

        mockMvc.perform(post("/api/bookings/booking123/deliver")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication())))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain; charset=UTF-8"))
                .andExpect(content().string("Giao xe thành công"));
    }

    @Test
    void testReceiveVehicle_success() throws Exception {
        Mockito.doNothing().when(bookingService).receiveVehicle("booking123", TOKEN);

        mockMvc.perform(post("/api/bookings/booking123/receive")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication())))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain; charset=UTF-8"))
                .andExpect(content().string("Nhận xe thành công"));
    }

    @Test
    void testReturnVehicle_success() throws Exception {
        Mockito.doNothing().when(bookingService).returnVehicle("booking123", TOKEN);

        mockMvc.perform(post("/api/bookings/booking123/return")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication())))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain; charset=UTF-8"))
                .andExpect(content().string("Trả xe thành công"));
    }

    @Test
    void testCompleteBooking_success() throws Exception {
        var body = """
                {
                  "timeFinish": "2025-07-29T15:00:00",
                  "costSettlement": 300000,
                  "note": "Hoàn tất đúng giờ"
                }
                """;

        Mockito.doNothing().when(bookingService)
                .completeBooking(Mockito.eq("booking123"), Mockito.eq(TOKEN),
                        Mockito.any(), BigDecimal.valueOf(Mockito.eq(300000)), Mockito.eq("Hoàn tất đúng giờ"));

        mockMvc.perform(post("/api/bookings/booking123/complete")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication()))
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(content().string("Hoàn tất đơn thành công"));
    }

    @Test
    void testCancelBooking_success() throws Exception {
        var body = """
                {
                  "reason": "Khách huỷ trước giờ"
                }
                """;

        CancelBookingResponseDTO response = new CancelBookingResponseDTO();
        response.setMessage("Đã huỷ đơn");

        Mockito.when(bookingService.cancelBooking(Mockito.eq("booking123"), Mockito.eq(TOKEN), Mockito.any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/bookings/booking123/cancel")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication()))
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã huỷ đơn"));
    }

    @Test
    void testPayBookingWithWallet_success() throws Exception {
        Mockito.doNothing().when(bookingService).payBookingWithWallet("booking123", TOKEN);

        mockMvc.perform(post("/api/bookings/booking123/pay-wallet")
                        .header("Authorization", "Bearer " + TOKEN)
                        .with(authentication(SecurityContextHolder.getContext().getAuthentication())))
                .andExpect(status().isOk())
                .andExpect(content().string("Thanh toán bằng ví thành công"));
    }

    @Test
    void testGetAllBookings_success() throws Exception {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getAllBookings())
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testGetBookingById_success() throws Exception {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingById("b1"))
                .thenReturn(dto);

        mockMvc.perform(get("/api/bookings/b1")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("b1"));
    }

    @Test
    void testGetBookingsByStatus_success() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByStatus("PENDING"))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/status/PENDING")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testGetBookingsByUserId_success() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByUserId("u1"))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/user/u1")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testGetBookingsByUserIdAndStatus_success() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByUserIdAndStatus("u1", "COMPLETED"))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/user/u1/status/COMPLETED")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testGetBookingsByProviderId_success() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByProviderId("p1"))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/provider/p1")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testGetBookingsByProviderIdAndStatus_success() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByProviderIdAndStatus("p1", "CANCELLED"))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/provider/p1/status/CANCELLED")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testGetBookingsByUserIdAndDateRange_success() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByUserIdAndDateRange(
                        Mockito.eq("u1"),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/user/u1/date-range")
                        .header("Authorization", "Bearer mock-token")
                        .param("startDate", "2025-07-01T00:00:00")
                        .param("endDate", "2025-07-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1")); // Đổi từ bookingId -> id
    }

    @Test
    void testCheckAvailability_success() throws Exception {
        Mockito.when(bookingService.isTimeSlotAvailable(Mockito.eq("v1"),
                        Mockito.any(), Mockito.any()))
                .thenReturn(true);

        String body = """
                {
                  "vehicleId": "v1",
                  "startTime": "2025-07-30T10:00:00",
                  "endTime": "2025-07-30T12:00:00"
                }
                """;

        mockMvc.perform(post("/api/bookings/check-availability")
                        .header("Authorization", "Bearer mock-token") // ✅ Bắt buộc nếu có security
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.message").value("Thời gian có sẵn"));
    }

    @Test
    void testGetBookingsByUserIdAndDateRange_success1() throws Exception {
        BookingDTO dto = new BookingDTO();
        dto.setId("b1");

        Mockito.when(bookingService.getBookingsByUserIdAndDateRange(
                        Mockito.eq("u1"),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/bookings/user/u1/date-range")
                        .param("startDate", "2025-07-01T00:00:00")
                        .param("endDate", "2025-07-31T23:59:59")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("b1"));
    }

    @Test
    void testCreateBooking_success() throws Exception {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleIds(List.of("v1"));

        BookingResponseDTO response = new BookingResponseDTO();
        response.setId("b1");

        Mockito.when(bookingService.createBooking(Mockito.any(), Mockito.eq("mock-user-id")))
                .thenReturn(response);

        String body = """
                {
                  "vehicleIds": ["v1"],
                  "timeBookingStart": "2025-07-30T10:00:00",
                  "timeBookingEnd": "2025-07-30T12:00:00",
                  "phoneNumber": "0901234567"
                }
                """;

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer mock-token")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("b1"));
    }

    @Test
    void testCreateBooking_conflict() throws Exception {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setVehicleIds(List.of("v1"));

        Mockito.when(bookingService.createBooking(Mockito.any(), Mockito.anyString()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã bị đặt"));

        String body = """
                {
                   "vehicleIds": ["v1"],
                   "timeBookingStart": "2025-07-30T10:00:00",
                   "timeBookingEnd": "2025-07-30T12:00:00",
                   "phoneNumber": "0901234567"
                }
                """;

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer mock-token")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Xe đã bị đặt"))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void testExtractToken_invalidFormat_throwsAccessDenied() throws Exception {
        // Arrange
        String invalidHeader = "InvalidTokenFormat";

        BookingService mockService = Mockito.mock(BookingService.class);
        BookingController controller = new BookingController(mockService);

        Method method = BookingController.class.getDeclaredMethod("extractToken", String.class);
        method.setAccessible(true);

        // Act & Assert
        InvocationTargetException exception = assertThrows(InvocationTargetException.class, () -> {
            method.invoke(controller, invalidHeader);
        });

        // ✅ Unwrap và kiểm tra chính xác loại và thông điệp exception bên trong
        Throwable cause = exception.getCause();
        assertTrue(cause instanceof AccessDeniedException);
        assertEquals("Token không hợp lệ hoặc không tồn tại", cause.getMessage());
    }

    @Test
    void testGetBookingsByUserIdAndDateRange_exception_returns500() throws Exception {
        Mockito.when(bookingService.getBookingsByUserIdAndDateRange(
                        Mockito.eq("u1"),
                        Mockito.any(), Mockito.any()))
                .thenThrow(new RuntimeException("Unexpected failure"));

        mockMvc.perform(get("/api/bookings/user/u1/date-range")
                        .param("startDate", "2025-07-01T00:00:00")
                        .param("endDate", "2025-07-31T23:59:59")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to retrieve bookings by date range: Unexpected failure"));
    }

    @Test
    void testCheckAvailability_available_true() throws Exception {
        // Giả lập service trả về true
        Mockito.when(bookingService.isTimeSlotAvailable("v1",
                        LocalDateTime.parse("2025-07-30T10:00:00"),
                        LocalDateTime.parse("2025-07-30T12:00:00")))
                .thenReturn(true);

        String requestBody = """
        {
          "vehicleId": "v1",
          "startTime": "2025-07-30T10:00:00",
          "endTime": "2025-07-30T12:00:00"
        }
        """;

        mockMvc.perform(post("/api/bookings/check-availability")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.message").value("Thời gian có sẵn"));
    }

    @Test
    void testCheckAvailability_available_false() throws Exception {
        // Giả lập service trả về false
        Mockito.when(bookingService.isTimeSlotAvailable("v1",
                        LocalDateTime.parse("2025-07-30T10:00:00"),
                        LocalDateTime.parse("2025-07-30T12:00:00")))
                .thenReturn(false);

        String requestBody = """
        {
          "vehicleId": "v1",
          "startTime": "2025-07-30T10:00:00",
          "endTime": "2025-07-30T12:00:00"
        }
        """;

        mockMvc.perform(post("/api/bookings/check-availability")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.message").value("Thời gian đã được đặt"));
    }
}