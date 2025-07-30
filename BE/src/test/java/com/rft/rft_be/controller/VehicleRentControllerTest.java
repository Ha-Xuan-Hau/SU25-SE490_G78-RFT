package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.*;
import com.rft.rft_be.service.vehicleRent.VehicleRentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

@SpringBootTest
@AutoConfigureMockMvc
public class VehicleRentControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VehicleRentService vehicleRentService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    private JwtAuthenticationToken buildJwtAuthToken(String userId, String role) {
        java.time.Instant now = java.time.Instant.now();
        java.util.Map<String, Object> claims = java.util.Map.of("userId", userId, "scope", role);
        Jwt jwt = new Jwt("fake-token", now, now.plusSeconds(3600), java.util.Map.of("alg", "none"), claims);
        return new JwtAuthenticationToken(jwt, java.util.List.of(
                (GrantedAuthority) () -> role,
                (GrantedAuthority) () -> "ROLE_" + role
        ));
    }

    @Test
    void registerVehicle_success() throws Exception {
        VehicleRentCreateDTO request = VehicleRentCreateDTO.builder()
                .vehicleType("CAR")
                .vehicleFeatures("Feature")
                .fuelType("GASOLINE")
                .build();
        VehicleGetDTO response = VehicleGetDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.createVehicle(ArgumentMatchers.any())).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value("1"));
    }

    @Test
    void registerVehicle_validationError() throws Exception {
        VehicleRentCreateDTO request = VehicleRentCreateDTO.builder().build(); // missing required fields
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void registerVehicle_serviceException() throws Exception {
        VehicleRentCreateDTO request = VehicleRentCreateDTO.builder()
                .vehicleType("CAR")
                .vehicleFeatures("Feature")
                .fuelType("GASOLINE")
                .build();
        Mockito.when(vehicleRentService.createVehicle(ArgumentMatchers.any())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void getVehicleById_success() throws Exception {
        VehicleDetailDTO detail = VehicleDetailDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.getVehicleById("1")).thenReturn(detail);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/1")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value("1"));
    }

    @Test
    void getVehicleById_notFound() throws Exception {
        Mockito.when(vehicleRentService.getVehicleById("1")).thenThrow(new RuntimeException("not found"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/1")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    void updateVehicle_success() throws Exception {
        VehicleRentUpdateDTO update = VehicleRentUpdateDTO.builder().vehicleType("CAR").build();
        VehicleGetDTO response = VehicleGetDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.updateVehicle(ArgumentMatchers.eq("1"), ArgumentMatchers.any())).thenReturn(response);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value("1"));
    }

    @Test
    void updateVehicle_serviceException() throws Exception {
        VehicleRentUpdateDTO update = VehicleRentUpdateDTO.builder().vehicleType("CAR").build();
        Mockito.when(vehicleRentService.updateVehicle(ArgumentMatchers.eq("1"), ArgumentMatchers.any())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void countUserVehicles_success() throws Exception {
        Mockito.when(vehicleRentService.countUserVehicles("user1")).thenReturn(5L);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/count")
                        .header("User-Id", "user1")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").value(5));
    }

    @Test
    void countUserVehicles_serviceException() throws Exception {
        Mockito.when(vehicleRentService.countUserVehicles("user1")).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/count")
                        .header("User-Id", "user1")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    void toggleVehicleStatus_success() throws Exception {
        VehicleGetDTO response = VehicleGetDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.toggleVehicleStatus("1")).thenReturn(response);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1/toggle-status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value("1"));
    }

    @Test
    void toggleVehicleStatus_serviceException() throws Exception {
        Mockito.when(vehicleRentService.toggleVehicleStatus("1")).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1/toggle-status")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void registerBulk_success() throws Exception {
        VehicleRentCreateDTO dto = VehicleRentCreateDTO.builder().vehicleType("CAR").vehicleFeatures("Feature").fuelType("GASOLINE").build();
        VehicleGetDTO response = VehicleGetDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.createVehicle(ArgumentMatchers.any())).thenReturn(response);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/registerBulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Test
    void registerBulk_runtimeException() throws Exception {
        VehicleRentCreateDTO dto = VehicleRentCreateDTO.builder().vehicleType("CAR").vehicleFeatures("Feature").fuelType("GASOLINE").build();
        Mockito.when(vehicleRentService.createVehicle(ArgumentMatchers.any())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/registerBulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void createMotorbieBicycle_success() throws Exception {
        VehicleRentCreateDTO dto = VehicleRentCreateDTO.builder().vehicleType("BICYCLE").vehicleFeatures("Feature").fuelType("ELECTRIC").build();
        List<VehicleGetDTO> response = List.of(VehicleGetDTO.builder().id("1").build());
        Mockito.when(vehicleRentService.createMotorbie_Bicycle(ArgumentMatchers.any())).thenReturn(response);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/create-motorbike-bicycle")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data[0].id").value("1"));
    }

    @Test
    void createMotorbieBicycle_serviceException() throws Exception {
        VehicleRentCreateDTO dto = VehicleRentCreateDTO.builder().vehicleType("BICYCLE").vehicleFeatures("Feature").fuelType("ELECTRIC").build();
        Mockito.when(vehicleRentService.createMotorbie_Bicycle(ArgumentMatchers.any())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/create-motorbike-bicycle")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void updateCommonVehicleInfo_success() throws Exception {
        VehicleRentUpdateDTO update = VehicleRentUpdateDTO.builder().vehicleType("CAR").build();
        VehicleGetDTO response = VehicleGetDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.updateCommonVehicleInfo(ArgumentMatchers.eq("1"), ArgumentMatchers.any())).thenReturn(response);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1/update-common")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value("1"));
    }

    @Test
    void updateCommonVehicleInfo_serviceException() throws Exception {
        VehicleRentUpdateDTO update = VehicleRentUpdateDTO.builder().vehicleType("CAR").build();
        Mockito.when(vehicleRentService.updateCommonVehicleInfo(ArgumentMatchers.eq("1"), ArgumentMatchers.any())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1/update-common")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void updateSpecificVehicleInfo_success() throws Exception {
        VehicleRentUpdateDTO update = VehicleRentUpdateDTO.builder().vehicleType("CAR").build();
        VehicleGetDTO response = VehicleGetDTO.builder().id("1").build();
        Mockito.when(vehicleRentService.updateSpecificVehicleInfo(ArgumentMatchers.eq("1"), ArgumentMatchers.any())).thenReturn(response);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1/update-specific")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value("1"));
    }

    @Test
    void updateSpecificVehicleInfo_serviceException() throws Exception {
        VehicleRentUpdateDTO update = VehicleRentUpdateDTO.builder().vehicleType("CAR").build();
        Mockito.when(vehicleRentService.updateSpecificVehicleInfo(ArgumentMatchers.eq("1"), ArgumentMatchers.any())).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/1/update-specific")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void getMyCarGrouped_success() throws Exception {
        PageResponseDTO<VehicleThumbGroupDTO> page = PageResponseDTO.<VehicleThumbGroupDTO>builder()
                .content(List.of(VehicleThumbGroupDTO.builder().thumb("thumb").vehicleNumber(1).build()))
                .currentPage(0).totalPages(1).totalElements(1).size(1).build();
        Mockito.when(vehicleRentService.getProviderCarGrouped(0, 10, "createdAt", "desc")).thenReturn(page);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-car")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.content[0].thumb").value("thumb"));
    }

    @Test
    void getMyCarGrouped_serviceException() throws Exception {
        Mockito.when(vehicleRentService.getProviderCarGrouped(0, 10, "createdAt", "desc")).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-car")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    void getMyMotorbikeGrouped_success() throws Exception {
        PageResponseDTO<VehicleThumbGroupDTO> page = PageResponseDTO.<VehicleThumbGroupDTO>builder()
                .content(List.of(VehicleThumbGroupDTO.builder().thumb("thumb").vehicleNumber(1).build()))
                .currentPage(0).totalPages(1).totalElements(1).size(1).build();
        Mockito.when(vehicleRentService.getProviderMotorbikeGroupedByThumb(0, 10, "createdAt", "desc")).thenReturn(page);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-motorbike")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.content[0].thumb").value("thumb"));
    }

    @Test
    void getMyMotorbikeGrouped_serviceException() throws Exception {
        Mockito.when(vehicleRentService.getProviderMotorbikeGroupedByThumb(0, 10, "createdAt", "desc")).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-motorbike")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    void getMyBicycleGrouped_success() throws Exception {
        PageResponseDTO<VehicleThumbGroupDTO> page = PageResponseDTO.<VehicleThumbGroupDTO>builder()
                .content(List.of(VehicleThumbGroupDTO.builder().thumb("thumb").vehicleNumber(1).build()))
                .currentPage(0).totalPages(1).totalElements(1).size(1).build();
        Mockito.when(vehicleRentService.getProviderBicycleGroupedByThumb(0, 10, "createdAt", "desc")).thenReturn(page);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-bicycle")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.content[0].thumb").value("thumb"));
    }

    @Test
    void getMyBicycleGrouped_serviceException() throws Exception {
        Mockito.when(vehicleRentService.getProviderBicycleGroupedByThumb(0, 10, "createdAt", "desc")).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-bicycle")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }
}
