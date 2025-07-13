package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.booking.*;
import com.rft.rft_be.service.booking.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

import static com.jayway.jsonpath.internal.path.PathCompiler.fail;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BookingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(bookingController)
                .defaultResponseCharacterEncoding(StandardCharsets.UTF_8)
                .build();
    }
    @Test
    void getAllBookings_success() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(List.of(new BookingResponseDTO()));

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getBookingById_success() throws Exception {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId("123");

        when(bookingService.getBookingById("123")).thenReturn(dto);

        mockMvc.perform(get("/api/bookings/123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("123"));
    }

    @Test
    void getBookingsByUserId_success() throws Exception {
        when(bookingService.getBookingsByUserId("user1")).thenReturn(List.of(new BookingDTO()));

        mockMvc.perform(get("/api/bookings/user/user1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void checkAvailability_true() throws Exception {
        Map<String, String> request = Map.of(
                "vehicleId", "v1",
                "startTime", "2025-08-01T10:00:00",
                "endTime", "2025-08-01T12:00:00"
        );

        when(bookingService.isTimeSlotAvailable(any(), any(), any())).thenReturn(true);

        mockMvc.perform(post("/api/bookings/check-availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void checkAvailability_false() throws Exception {
        Map<String, String> request = Map.of(
                "vehicleId", "v1",
                "startTime", "2025-08-01T10:00:00",
                "endTime", "2025-08-01T12:00:00"
        );

        when(bookingService.isTimeSlotAvailable(any(), any(), any())).thenReturn(false);

        mockMvc.perform(post("/api/bookings/check-availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.message").value("Thời gian đã được đặt"));
    }

    @Test
    void payWithWallet_success() throws Exception {
        doNothing().when(bookingService).payBookingWithWallet(any(), any());

        mockMvc.perform(post("/api/bookings/123/pay-wallet")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(content().string("Thanh toán bằng ví thành công"));
    }

    @Test
    void completeBooking_success() throws Exception {
        CompleteBookingRequestDTO req = new CompleteBookingRequestDTO();
        req.setCostSettlement(BigDecimal.valueOf(100000));
        req.setNote("note");

        doNothing().when(bookingService).completeBooking(any(), any(), BigDecimal.valueOf(anyInt()), any());

        mockMvc.perform(post("/api/bookings/123/complete")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("Hoàn tất đơn thành công"));
    }

    @Test
    void handleResponseStatusException_conflict() throws Exception {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.CONFLICT, "Booking conflict");
        ResponseEntity<Map<String, Object>> response = bookingController.handleResponseStatusException(ex);

        assert response.getStatusCode().value() == 409;
        assert response.getBody().get("message").equals("Booking conflict");
    }

    @Test
    void extractToken_invalidHeader_throwsException() throws Exception {
        BookingController controller = new BookingController(bookingService);
        Method method = BookingController.class.getDeclaredMethod("extractToken", String.class);
        method.setAccessible(true);

        try {
            method.invoke(controller, "Invalid");
            fail("Expected AccessDeniedException was not thrown");
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            assertTrue(cause instanceof AccessDeniedException);
            assertEquals("Token không hợp lệ hoặc không tồn tại", cause.getMessage());
        }
    }
}
