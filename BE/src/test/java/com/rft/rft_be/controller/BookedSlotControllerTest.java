package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.booking.BookedSlotResponse;
import com.rft.rft_be.service.bookingTimeSlot.BookedTimeSlotService;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookedSlotController.class)
class BookedSlotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookedTimeSlotService bookedTimeSlotService;

    @Autowired
    private ObjectMapper objectMapper;

    @WithMockUser
    @Test
    void getBookedSlotsByVehicleId_shouldReturnBookedSlots() throws Exception {
        // Arrange
        String vehicleId = "veh123";
        LocalDateTime timeFrom = LocalDateTime.now().plusHours(1);
        LocalDateTime timeTo = timeFrom.plusHours(1);

        BookedSlotResponse response = BookedSlotResponse.builder()
                .timeFrom(timeFrom)
                .timeTo(timeTo)
                .build();

        when(bookedTimeSlotService.getBookingSlotByVehicleId(vehicleId))
                .thenReturn(List.of(response));

        // Act & Assert
        mockMvc.perform(get("/api/bookedTimeSlot/vehicle/{id}", vehicleId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].timeFrom").exists())
                .andExpect(jsonPath("$[0].timeTo").exists());
    }

    @WithMockUser
    @Test
    void getBookedSlotsByVehicleId_shouldReturnEmptyListWhenNoSlotFound() throws Exception {
        // Arrange
        String vehicleId = "vehEmpty";
        when(bookedTimeSlotService.getBookingSlotByVehicleId(vehicleId)).thenReturn(List.of());

        // Act & Assert
        mockMvc.perform(get("/api/bookedTimeSlot/vehicle/{id}", vehicleId))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}