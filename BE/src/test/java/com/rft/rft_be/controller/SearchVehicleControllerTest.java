package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.vehicle.BasicSearchDTO;
import com.rft.rft_be.dto.vehicle.VehicleSearchResultDTO;

import com.rft.rft_be.service.vehicle.VehicleService;
import org.junit.jupiter.api.Test;
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

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class SearchVehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VehicleService vehicleService;

    @Test
    void basicSearch_success() throws Exception {
        // 1. Prepare request DTO
        BasicSearchDTO request = BasicSearchDTO.builder()
                .address("Hanoi")
                .vehicleType("CAR")
                .pickupDateTime("2025-07-07T00:00:00Z")
                .returnDateTime("2025-07-10T00:00:00Z")
                .page(0)
                .size(10)
                .build();

        // 2. Prepare mock response
        VehicleSearchResultDTO vehicle1 = VehicleSearchResultDTO.builder()
                .id("v1")
                .licensePlate("30A-12345")
                .vehicleType("CAR")
                .thumb("https://example.com/thumb.jpg")
                .costPerDay(BigDecimal.valueOf(500000))
                .status("AVAILABLE")
                .brandName("Toyota")
                .modelName("Vios")
                .numberSeat(5)
                .rating(4.5)
                .address("Hanoi")
                .build();

        Page<VehicleSearchResultDTO> mockPage = new PageImpl<>(List.of(vehicle1), PageRequest.of(0, 10), 1);

        // 3. Stub service
        Mockito.when(vehicleService.basicSearch(Mockito.anyString(), Mockito.anyString(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(mockPage);

        // 4. Perform request
        mockMvc.perform(post("/api/vehicles/search-basic")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].licensePlate").value("30A-12345"))
                .andExpect(jsonPath("$.content[0].brandName").value("Toyota"))
                .andExpect(jsonPath("$.content[0].costPerDay").value(500000))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.currentPage").value(0));
    }
}