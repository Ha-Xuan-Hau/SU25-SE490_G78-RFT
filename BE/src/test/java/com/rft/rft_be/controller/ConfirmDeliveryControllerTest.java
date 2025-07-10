package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.booking.CompleteBookingRequestDTO;
import com.rft.rft_be.service.booking.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;

import static org.mockito.Mockito.doThrow;

@SpringBootTest(properties = "spring.main.allow-bean-definition-overriding=true")
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
public class ConfirmDeliveryControllerTest {

    @TestConfiguration
    static class MockSecurityConfig {
        @Bean
        @Primary
        public JwtDecoder jwtDecoder() {
            Jwt mockJwt = Jwt.withTokenValue("token")
                    .header("alg", "none")
                    .claim("userId", "mock-user-id")
                    .claim("scope", "ROLE_USER")
                    .build();

            JwtDecoder jwtDecoder = Mockito.mock(JwtDecoder.class);
            Mockito.when(jwtDecoder.decode(Mockito.anyString())).thenReturn(mockJwt);

            return jwtDecoder;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    private final String token = "Bearer test-token";
    private final String bookingId = "booking-001";

    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    @DisplayName("Xác nhận giao xe - thành công")
    void confirmDelivery_success() throws Exception {
        Mockito.doNothing().when(bookingService).deliverVehicle(Mockito.eq(bookingId), Mockito.anyString());

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/deliver")
                        .header("Authorization", token)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    @DisplayName("Xác nhận giao xe - thất bại vì không phải trạng thái PENDING")
    void confirmDelivery_fail_invalidStatus() throws Exception {
        Mockito.doThrow(new RuntimeException("Chỉ đơn ở trạng thái PENDING mới được xác nhận giao xe"))
                .when(bookingService).deliverVehicle(Mockito.eq(bookingId), Mockito.anyString());

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/deliver")
                        .header("Authorization", token)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Chỉ đơn ở trạng thái PENDING mới được xác nhận giao xe"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    @DisplayName("Xác nhận nhận xe - thành công")
    void confirmReceive_success() throws Exception {
        Mockito.doNothing().when(bookingService).receiveVehicle(Mockito.eq(bookingId), Mockito.anyString());

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/receive")
                        .header("Authorization", token)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    @DisplayName("Xác nhận nhận xe - thất bại")
    void confirmReceive_fail() throws Exception {
        Mockito.doThrow(new RuntimeException("Chỉ đơn đặt ở trạng thái DELIVERED mới được xác nhận đã nhận xe"))
                .when(bookingService).receiveVehicle(Mockito.eq(bookingId), Mockito.anyString());

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/receive")
                        .header("Authorization", token)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Chỉ đơn đặt ở trạng thái DELIVERED mới được xác nhận đã nhận xe"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER", "PROVIDER"})
    @DisplayName("Xác nhận trả xe - thành công")
    void confirmReturn_success() throws Exception {
        Mockito.doNothing().when(bookingService).returnVehicle(Mockito.eq(bookingId), Mockito.anyString());

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/return")
                        .header("Authorization", token)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER", "PROVIDER"})
    @DisplayName("Xác nhận trả xe - thất bại")
    void confirmReturn_fail() throws Exception {
        Mockito.doThrow(new RuntimeException("Chỉ đơn đặt ở trạng thái RECEIVED_BY_CUSTOMER mới được trả xe."))
                .when(bookingService).returnVehicle(Mockito.eq(bookingId), Mockito.anyString());

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/return")
                        .header("Authorization", token)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Chỉ đơn đặt ở trạng thái RECEIVED_BY_CUSTOMER mới được trả xe."));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    @DisplayName("Xác nhận hoàn thành đơn - thành công")
    void completeBooking_success() throws Exception {
        CompleteBookingRequestDTO dto = new CompleteBookingRequestDTO();
        dto.setCostSettlement(new BigDecimal("1500000"));
        dto.setNote("Hoàn thành");

        Mockito.doNothing().when(bookingService)
                .completeBooking(Mockito.eq(bookingId), Mockito.anyString(), Mockito.eq(dto.getCostSettlement()), Mockito.eq(dto.getNote()));

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    @DisplayName("Xác nhận hoàn thành đơn - thất bại vì trạng thái chưa trả xe")
    void completeBooking_fail_notReturned() throws Exception {
        CompleteBookingRequestDTO dto = new CompleteBookingRequestDTO();
        dto.setCostSettlement(new BigDecimal("1500000"));
        dto.setNote("Hoàn thành");

        Mockito.doThrow(new RuntimeException("Không thể hoàn thành đơn vì xe chưa được trả"))
                .when(bookingService).completeBooking(Mockito.eq(bookingId), Mockito.anyString(), Mockito.eq(dto.getCostSettlement()), Mockito.eq(dto.getNote()));

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Không thể hoàn thành đơn vì xe chưa được trả"));
    }
}
