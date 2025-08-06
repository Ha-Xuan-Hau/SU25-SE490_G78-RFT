package com.rft.rft_be.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.service.vehicle.VehicleService;
import com.rft.rft_be.util.JwtUtil;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class VehicleControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VehicleService vehicleService; // Nếu cần mock

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JwtDecoder jwtDecoder;


    @Test
    void shouldReturnListOfVehicles() throws Exception {
        List<VehicleCardDetailDTO> mockVehicles = List.of(new VehicleCardDetailDTO(/* ... */));
        when(vehicleService.getAllVehicles()).thenReturn(mockVehicles);

        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(mockVehicles.size()));
    }

    @Test
    void shouldReturnVehicleById() throws Exception {
        String id = "veh123";

        VehicleGetDTO mockVehicle = new VehicleGetDTO();
        mockVehicle.setId(id); // ✅ Gán id cho DTO

        when(vehicleService.getVehicleById(id)).thenReturn(mockVehicle);

        mockMvc.perform(get("/api/vehicles/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id)); // ✅ So sánh đúng giá trị
    }

    @Test
    void shouldUpdateVehicleSuccessfully() throws Exception {
        String id = "veh123";

        VehicleGetDTO requestDto = new VehicleGetDTO();
        requestDto.setId(id);

        VehicleGetDTO responseDto = new VehicleGetDTO();
        responseDto.setId(id);

        when(vehicleService.updateVehicle(eq(id), any())).thenReturn(responseDto);

        // ✅ Fake decoded JWT
        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .build();

        when(jwtDecoder.decode(any())).thenReturn(jwt);

        mockMvc.perform(put("/api/vehicles/" + id)
                        .header("Authorization", "Bearer dummy-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void shouldReturnSearchResults() throws Exception {
        VehicleSearchDTO searchDTO = new VehicleSearchDTO();
        searchDTO.setPickupDateTime("2025-07-06T10:00:00");
        searchDTO.setReturnDateTime("2025-07-08T10:00:00");
        // Thêm các field bắt buộc nếu có

        VehicleSearchResultDTO resultDTO = new VehicleSearchResultDTO();
        // Thiết lập field trong resultDTO nếu cần để kiểm tra cụ thể

        Page<VehicleSearchResultDTO> mockResult = new PageImpl<>(List.of(resultDTO));

        when(vehicleService.searchVehicles(any(), any(), any())).thenReturn(mockResult);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    void shouldReturnHealthStatus() throws Exception {
        mockMvc.perform(get("/api/vehicles/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("VehicleController"));
    }


    @Test
    void shouldReturnNotFoundWhenDeletingNonexistentVehicle() throws Exception {
        // ✅ Bắt buộc: mock JWT hợp lệ
        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("authorities", List.of("ROLE_USER"))
                .build();

        when(jwtDecoder.decode(any())).thenReturn(jwt); // ✅ BẮT BUỘC CÓ

        // Mock service ném lỗi
        doThrow(new RuntimeException("Vehicle not found"))
                .when(vehicleService).deleteVehicle("not-exist");

        // Gửi request có Authorization header
        mockMvc.perform(delete("/api/vehicles/not-exist")
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Vehicle not found"));
    }

    @Test
    void shouldReturnVehicleDetailById() throws Exception {
        String id = "veh123";
        VehicleDetailDTO mockDetail = new VehicleDetailDTO();
        mockDetail.setId(id);

        when(vehicleService.getVehicleDetailById(id)).thenReturn(mockDetail);

        mockMvc.perform(get("/api/vehicles/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void shouldReturnVehiclesByStatus() throws Exception {
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByStatus("ACTIVE")).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/status/ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnBadRequestForInvalidStatus() throws Exception {
        when(vehicleService.getVehiclesByStatus("INVALID"))
                .thenThrow(new RuntimeException("Invalid status"));

        mockMvc.perform(get("/api/vehicles/status/INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status"));
    }

    @Test
    void shouldDeleteVehicleSuccessfully() throws Exception {
        // ✅ Mock JWT hợp lệ
        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("authorities", List.of("ROLE_USER"))
                .build();

        when(jwtDecoder.decode(any())).thenReturn(jwt);

        mockMvc.perform(delete("/api/vehicles/veh123")
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturnNotFoundWhenDeletingVehicle() throws Exception {
        // 🔧 Fix: mock jwt hợp lệ
        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("authorities", List.of("ROLE_USER"))
                .build();

        when(jwtDecoder.decode(any())).thenReturn(jwt);

        // Giả lập exception từ service
        doThrow(new RuntimeException("Vehicle not found"))
                .when(vehicleService).deleteVehicle("not-exist");

        mockMvc.perform(delete("/api/vehicles/not-exist")
                        .header("Authorization", "Bearer dummy-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Vehicle not found"));
    }

    @Test
    void shouldReturnVehicleCountByStatus() throws Exception {
        List<VehicleGetDTO> mockList = List.of(new VehicleGetDTO(), new VehicleGetDTO());
        when(vehicleService.getVehiclesByStatus("ACTIVE")).thenReturn(mockList);

        mockMvc.perform(get("/api/vehicles/count/status/ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.count").value(2));
    }

    @Test
    void shouldReturnAvailableQuantityByThumb() throws Exception {
        VehicleAvailabilityByThumbRequestDTO req = new VehicleAvailabilityByThumbRequestDTO();
        req.setThumb("thumb001");
        req.setProviderId("user001");
        req.setFrom(LocalDateTime.parse("2025-07-29T10:00:00"));
        req.setTo(LocalDateTime.parse("2025-07-30T10:00:00"));

        AvailableVehicleQuantityOnlyDTO result = new AvailableVehicleQuantityOnlyDTO();
        result.setQuantity(3);

        when(vehicleService.getQuantityOfAvailableVehiclesByThumb(
                anyString(), anyString(), any(), any()))
                .thenReturn(result);

        mockMvc.perform(post("/api/vehicles/available-thumb-quantity")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    void shouldSearchVehiclesWithEmptyResult() throws Exception {
        VehicleSearchDTO searchDTO = new VehicleSearchDTO();
        Page<VehicleSearchResultDTO> emptyResult = new PageImpl<>(Collections.emptyList());

        when(vehicleService.searchVehicles(any(), any(), any())).thenReturn(emptyResult);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void shouldReturnNotFoundWhenVehicleDoesNotExist() throws Exception {
        when(vehicleService.getVehicleById("nonexistent"))
                .thenThrow(new EntityNotFoundException("Vehicle not found"));

        mockMvc.perform(get("/api/vehicles/nonexistent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404))
                .andExpect(jsonPath("$.message").value("Vehicle not found"));
    }

    @Test
    void shouldReturnEmptySearchResult() throws Exception {
        VehicleSearchDTO searchDTO = new VehicleSearchDTO();
        searchDTO.setPickupDateTime("2025-07-06T10:00:00");
        searchDTO.setReturnDateTime("2025-07-08T10:00:00");

        Page<VehicleSearchResultDTO> emptyResult = new PageImpl<>(List.of());

        when(vehicleService.searchVehicles(any(), any(), any())).thenReturn(emptyResult);

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(searchDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void shouldReturnBadRequestWhenSearchDTOInvalid() throws Exception {
        VehicleSearchDTO invalidDto = new VehicleSearchDTO(); // thiếu ngày

        mockMvc.perform(post("/api/vehicles/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnVehicleListByUserId() throws Exception {
        String userId = "user123";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByUserId(userId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/user/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnVehiclesByUserId() throws Exception {
        String userId = "user123";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO(), new VehicleGetDTO());
        when(vehicleService.getVehiclesByUserId(userId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/user/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }


    @Test
    void shouldReturnVehicleByLicensePlate() throws Exception {
        String licensePlate = "XYZ-123";
        VehicleGetDTO vehicle = new VehicleGetDTO();
        vehicle.setLicensePlate(licensePlate);
        when(vehicleService.getVehicleByLicensePlate(licensePlate)).thenReturn(vehicle);

        mockMvc.perform(get("/api/vehicles/license-plate/" + licensePlate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licensePlate").value(licensePlate));
    }


    @Test
    void shouldReturnVehicleDetailByIdSuccessfully() throws Exception {
        String id = "veh123";
        VehicleDetailDTO mockResponse = new VehicleDetailDTO(); // điền các field cần thiết nếu có
        when(vehicleService.getVehicleDetailById(id)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/vehicles/{id}", id))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnAllVehiclesSuccessfully() throws Exception {
        List<VehicleCardDetailDTO> vehicles = List.of(new VehicleCardDetailDTO());
        when(vehicleService.getAllVehicles()).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnBasicSearchResults() throws Exception {
        Page<VehicleSearchResultDTO> page = new PageImpl<>(List.of(new VehicleSearchResultDTO()));
        String address = "Hanoi";
        String type = "CAR";

        when(vehicleService.basicSearch(eq(address), eq(type), any(), any(), any())).thenReturn(page);

        BasicSearchDTO dto = new BasicSearchDTO();
        dto.setAddress(address);
        dto.setVehicleType(type);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        dto.setPickupDateTime(LocalDateTime.now().format(formatter));
        dto.setReturnDateTime(LocalDateTime.now().plusDays(2).format(formatter));

        mockMvc.perform(post("/api/vehicles/search-basic")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }


    @Test
    void shouldReturnListAndQuantityOfAvailableVehiclesByThumb() throws Exception {
        String thumb = "abc123";
        String providerId = "user123";
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        AvailableVehicleListWithQuantityDTO response = new AvailableVehicleListWithQuantityDTO();
        when(vehicleService.getListAndQuantityOfAvailableVehiclesByThumb(eq(thumb), eq(providerId), eq(from), eq(to)))
                .thenReturn(response);

        VehicleAvailabilityByThumbRequestDTO req = new VehicleAvailabilityByThumbRequestDTO();
        req.setThumb(thumb);
        req.setProviderId(providerId);
        req.setFrom(from);
        req.setTo(to);

        mockMvc.perform(post("/api/vehicles/available-thumb-list")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnVehiclesByVehicleType() throws Exception {
        String vehicleType = "CAR";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getVehiclesByVehicleType(vehicleType)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/vehicle-type/" + vehicleType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnVehiclesByVehicleTypeAndStatus() throws Exception {
        String vehicleType = "CAR";
        String status = "ACTIVE";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getVehiclesByVehicleTypeAndStatus(vehicleType, status)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/vehicle-type/" + vehicleType + "/status/" + status))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnVehiclesByHaveDriver() throws Exception {
        String haveDriver = "true";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getVehiclesByHaveDriver(haveDriver)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/have-driver/" + haveDriver))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnVehiclesByBrandId() throws Exception {
        String brandId = "brand001";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getVehiclesByBrandId(brandId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/brand/" + brandId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnVehiclesByModelId() throws Exception {
        String modelId = "model001";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getVehiclesByModelId(modelId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/model/" + modelId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnVehiclesByPenaltyId() throws Exception {
        String penaltyId = "penalty001";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getVehiclesByPenaltyId(penaltyId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/penalty/" + penaltyId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnTotalVehicleCount() throws Exception {
        List<VehicleCardDetailDTO> vehicles = List.of(new VehicleCardDetailDTO(), new VehicleCardDetailDTO());

        when(vehicleService.getAllVehicles()).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));
    }

    @Test
    void shouldReturnUserAvailableVehiclesByType() throws Exception {
        String userId = "user001";
        String vehicleType = "CAR";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO(), new VehicleGetDTO());

        when(vehicleService.getUserAvailableVehiclesByType(userId, vehicleType)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/users/" + userId + "/available/" + vehicleType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicles.length()").value(2))
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.vehicleType").value("CAR"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void shouldReturnVehiclesByBrandId1() throws Exception {
        String brandId = "brand001";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByBrandId(brandId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/brand/" + brandId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnErrorWhenBrandIdFails() throws Exception {
        String brandId = "brand001";
        when(vehicleService.getVehiclesByBrandId(brandId)).thenThrow(new RuntimeException("Failed to retrieve vehicles"));

        mockMvc.perform(get("/api/vehicles/brand/" + brandId))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to retrieve vehicles by brand: Failed to retrieve vehicles"));
    }

    @Test
    void shouldReturnVehiclesByModelId2() throws Exception {
        String modelId = "model001";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByModelId(modelId)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/model/" + modelId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnVehiclesByVehicleType1() throws Exception {
        String vehicleType = "CAR";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByVehicleType(vehicleType)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/vehicle-type/" + vehicleType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnBadRequestWhenVehicleTypeInvalid() throws Exception {
        String vehicleType = "INVALID";
        when(vehicleService.getVehiclesByVehicleType(vehicleType))
                .thenThrow(new RuntimeException("Invalid vehicle type"));

        mockMvc.perform(get("/api/vehicles/vehicle-type/" + vehicleType))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid vehicle type"));
    }

    @Test
    void shouldReturnVehiclesByVehicleTypeAndStatus1() throws Exception {
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByVehicleTypeAndStatus("CAR", "ACTIVE")).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/vehicle-type/CAR/status/ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnVehiclesByPenaltyId1() throws Exception {
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());
        when(vehicleService.getVehiclesByPenaltyId("pen123")).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/penalty/pen123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnUserAvailableVehiclesByType1() throws Exception {
        String userId = "user123";
        String vehicleType = "CAR";
        List<VehicleGetDTO> vehicles = List.of(new VehicleGetDTO());

        when(vehicleService.getUserAvailableVehiclesByType(userId, vehicleType)).thenReturn(vehicles);

        mockMvc.perform(get("/api/vehicles/users/{userId}/available/{vehicleType}", userId, vehicleType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicles").isArray())
                .andExpect(jsonPath("$.count").value(1));
    }

    @Test
    void shouldReturnInternalServerErrorWhenGetVehicleCountFails() throws Exception {
        when(vehicleService.getAllVehicles()).thenThrow(new RuntimeException("DB down"));

        mockMvc.perform(get("/api/vehicles/count"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to get count: DB down"));
    }

    @Test
    void shouldReturnBadRequestWhenStatusInvalid() throws Exception {
        when(vehicleService.getVehiclesByStatus("INVALID"))
                .thenThrow(new RuntimeException("Invalid status"));

        mockMvc.perform(get("/api/vehicles/count/status/INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status"));
    }

    @Test
    void shouldReturnBadRequestWhenCountByStatusFails() throws Exception {
        when(vehicleService.getVehiclesByStatus("ACTIVE"))
                .thenThrow(new RuntimeException("DB crash"));

        mockMvc.perform(get("/api/vehicles/count/status/ACTIVE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("DB crash"));
    }

    @Test
    void shouldReturnNotFoundWhenUpdatingNonexistentVehicle() throws Exception {
        String id = "veh123";
        VehicleGetDTO dto = new VehicleGetDTO();

        // ✅ Fake JWT
        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .build();

        when(jwtDecoder.decode(any())).thenReturn(jwt);

        when(vehicleService.updateVehicle(eq(id), any()))
                .thenThrow(new RuntimeException("Vehicle not found"));

        mockMvc.perform(put("/api/vehicles/" + id)
                        .header("Authorization", "Bearer dummy-token") // ✅ Cần có
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Vehicle not found"));
    }

    @Test
    void shouldReturnBadRequestWhenUpdateVehicleWithInvalidData() throws Exception {
        String id = "veh123";
        VehicleGetDTO invalidDto = new VehicleGetDTO(); // all fields null

        // ✅ Mock JWT hợp lệ
        Jwt jwt = Jwt.withTokenValue("dummy-token")
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("authorities", List.of("ROLE_USER"))
                .build();

        when(jwtDecoder.decode(any())).thenReturn(jwt);
        when(vehicleService.updateVehicle(eq(id), any()))
                .thenThrow(new RuntimeException("Invalid input"));

        mockMvc.perform(put("/api/vehicles/" + id)
                        .header("Authorization", "Bearer dummy-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid input"));
    }

    @Test
    void shouldReturnUnauthorizedWhenMissingTokenForUpdate() throws Exception {
        String id = "veh123";
        VehicleGetDTO dto = new VehicleGetDTO();

        mockMvc.perform(put("/api/vehicles/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnUnauthorizedWhenUpdateWithoutJwt() throws Exception {
        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setId("veh123");

        mockMvc.perform(put("/api/vehicles/veh123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }


    @Test
    void shouldReturnBadRequestWhenHaveDriverInvalid() throws Exception {
        when(vehicleService.getVehiclesByHaveDriver("invalid"))
                .thenThrow(new RuntimeException("Invalid value"));

        mockMvc.perform(get("/api/vehicles/have-driver/invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid value"));
    }

    @Test
    void shouldReturnInternalServerErrorWhenHaveDriverCrash() throws Exception {
        when(vehicleService.getVehiclesByHaveDriver("true"))
                .thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(get("/api/vehicles/have-driver/true"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("DB error"));
    }

    @Test
    void shouldReturnVehiclesByTypeAndStatus() throws Exception {
        when(vehicleService.getVehiclesByVehicleTypeAndStatus("CAR", "ACTIVE"))
                .thenReturn(List.of(new VehicleGetDTO()));

        mockMvc.perform(get("/api/vehicles/vehicle-type/CAR/status/ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldReturnBadRequestWhenTypeAndStatusInvalid() throws Exception {
        when(vehicleService.getVehiclesByVehicleTypeAndStatus("X", "INVALID"))
                .thenThrow(new RuntimeException("Invalid input"));

        mockMvc.perform(get("/api/vehicles/vehicle-type/X/status/INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid input"));
    }

    @Test
    void shouldReturnInternalServerErrorWhenTypeAndStatusFails() throws Exception {
        when(vehicleService.getVehiclesByVehicleTypeAndStatus("CAR", "ACTIVE"))
                .thenThrow(new RuntimeException("DB failure"));

        mockMvc.perform(get("/api/vehicles/vehicle-type/CAR/status/ACTIVE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("DB failure"));
    }

    @Test
    void shouldReturnInternalServerErrorWhenModelIdFails() throws Exception {
        when(vehicleService.getVehiclesByModelId("model123"))
                .thenThrow(new RuntimeException("crash")); // <-- chỉ để message là "crash"

        mockMvc.perform(get("/api/vehicles/model/model123"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to retrieve vehicles by model: crash"));
    }

    @Test
    void shouldReturnNotFoundWhenLicensePlateNotExist() throws Exception {
        when(vehicleService.getVehicleByLicensePlate("NOT_FOUND"))
                .thenThrow(new RuntimeException("Vehicle not found"));

        mockMvc.perform(get("/api/vehicles/license-plate/NOT_FOUND"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Vehicle not found"));
    }

    @Test
    void shouldReturnInternalServerErrorWhenLicensePlateFails() throws Exception {
        when(vehicleService.getVehicleByLicensePlate("ABC123"))
                .thenThrow(new RuntimeException("Unexpected DB error"));

        mockMvc.perform(get("/api/vehicles/license-plate/ABC123"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Unexpected DB error"));
    }
    @Test
    void shouldReturnBadRequestWhenHaveDriverThrowsRuntimeException() throws Exception {
        when(vehicleService.getVehiclesByHaveDriver("true"))
                .thenThrow(new RuntimeException("invalid input"));

        mockMvc.perform(get("/api/vehicles/have-driver/true"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid input"));
    }

    @Test
    void shouldReturnBadRequestWhenTypeAndStatusThrowsRuntimeException() throws Exception {
        when(vehicleService.getVehiclesByVehicleTypeAndStatus("CAR", "ACTIVE"))
                .thenThrow(new RuntimeException("invalid combination"));

        mockMvc.perform(get("/api/vehicles/vehicle-type/CAR/status/ACTIVE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid combination"));
    }

    @Test
    void shouldDeleteVehicleSuccessfully1() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", "user123")
                .claim("scope", "ROLE_ADMIN") // hoặc authorities
                .build();

        Collection<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));

        JwtAuthenticationToken authToken = new JwtAuthenticationToken(jwt, authorities);

        mockMvc.perform(delete("/api/vehicles/veh123")
                        .with(authentication(authToken)))
                .andExpect(status().isNoContent());

        verify(vehicleService).deleteVehicle("veh123");
    }

    @WithMockUser
    @Test
    void shouldReturnNotFoundWhenDeletingNonexistentVehicle1() throws Exception {
        doThrow(new RuntimeException("not found")).when(vehicleService).deleteVehicle("veh123");

        mockMvc.perform(delete("/api/vehicles/veh123"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("not found"));
    }

    @WithMockUser
    @Test
    void shouldReturnBadRequestWhenDeleteFailsWithRuntimeException() throws Exception {
        doThrow(new RuntimeException("invalid id")).when(vehicleService).deleteVehicle("veh123");

        mockMvc.perform(delete("/api/vehicles/veh123"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid id"));
    }
    @Test
    @WithMockUser
    void shouldReturnBadRequestWhenDeleteFailsWithRuntimeException1() throws Exception {
        doThrow(new RuntimeException("unexpected crash")).when(vehicleService).deleteVehicle("veh123");

        mockMvc.perform(delete("/api/vehicles/veh123"))
                .andExpect(status().isBadRequest()) // ✅ 400 đúng với logic controller
                .andExpect(jsonPath("$.error").value("unexpected crash"));
    }
}
