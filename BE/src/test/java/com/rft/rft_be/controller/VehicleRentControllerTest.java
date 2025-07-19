package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.dto.vehicle.VehicleImageDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.PageResponseDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentCreateDTO;
import com.rft.rft_be.dto.vehicle.vehicleRent.VehicleRentUpdateDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.service.vehicleRent.VehicleRentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@SpringBootTest
@AutoConfigureMockMvc
public class VehicleRentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VehicleRentService vehicleRentService;

    private VehicleRentCreateDTO request;
    private VehicleGetDTO mockVehicleGetDTO;

    @BeforeEach
    void setUp() {
        request = VehicleRentCreateDTO.builder()
                .brandId("brand123")
                .modelId("model456")
                .licensePlate("ABC-123")
                .vehicleType("CAR")
                .vehicleFeatures("GPS, Bluetooth")
                .vehicleImages("img1.jpg,img2.jpg")
                .insuranceStatus("YES")
                .shipToAddress("NO")
                .numberSeat(5)
                .yearManufacture(2022)
                .transmission("AUTOMATIC")
                .fuelType("GASOLINE")
                .description("Một chiếc xe thoải mái.")
                .numberVehicle(1)
                .haveDriver("YES")
                .status("AVAIABLE")
                .costPerDay(new BigDecimal("50.00"))
                .thumb("thumb")
                .build();

        List<VehicleImageDTO> expectedVehicleImages;
        String vehicleImagesString = request.getVehicleImages();
        if (vehicleImagesString != null && !vehicleImagesString.isEmpty()) {
            expectedVehicleImages = Arrays.stream(vehicleImagesString.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(url -> VehicleImageDTO.builder().imageUrl(url).build())
                    .collect(Collectors.toList());
        } else {
            expectedVehicleImages = List.of();
        }

        mockVehicleGetDTO = VehicleGetDTO.builder()
                .id("vehicleId123")
                .userId("testUserId")
                .brandId(request.getBrandId())
                .modelId(request.getModelId())
                .licensePlate(request.getLicensePlate())
                .vehicleType(request.getVehicleType())
                .vehicleFeatures(request.getVehicleFeatures())
                .vehicleImages(expectedVehicleImages)
                .haveDriver("NO")
                .insuranceStatus("NO")
                .shipToAddress("NO")
                .numberSeat(request.getNumberSeat())
                .yearManufacture(request.getYearManufacture())
                .transmission(request.getTransmission())
                .fuelType(request.getFuelType())
                .description(request.getDescription())
                .numberVehicle(request.getNumberVehicle())
                .costPerDay(request.getCostPerDay())
                .status("AVAILABLE")
                .thumb(request.getThumb())
                .totalRatings(0)
                .likes(0)
                .build();
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_Success() throws Exception {
        Mockito.when(vehicleRentService.createVehicle(Mockito.any(VehicleRentCreateDTO.class)))
                .thenReturn(mockVehicleGetDTO);

        ObjectMapper objectMapper = new ObjectMapper();
        String content = objectMapper.writeValueAsString(request);

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.id").value(mockVehicleGetDTO.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data.licensePlate").value(request.getLicensePlate()));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_MissingVehicleType_fail() throws Exception {
        request.setVehicleType(null);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))

                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.vehicleType").value("Vehicle type is required"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_MissingVehicleFeatures_fail() throws Exception {
        request.setVehicleFeatures(null);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.vehicleFeatures").value("Vehicle Features is required"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_MissingVehicleImages_fail() throws Exception {
        request.setVehicleImages(null);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.vehicleImages").value("Vehicle Image is required"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_MissingFuelType_fail() throws Exception {
        request.setFuelType(null);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.fuelType").value("Fuel type is required"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidNumberSeat_fail() throws Exception {
        request.setNumberSeat(0);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.numberSeat").value("Number of seats must be at least 1"));
    }


    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidCostPerDay_fail() throws Exception {
        request.setCostPerDay(BigDecimal.ZERO);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.errors.costPerDay").value("Cost per day must be greater than 0"));
    }



    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_Motorbike_success() throws Exception {
        request.setVehicleType("MOTORBIKE");
        request.setBrandId("brand123");
        request.setLicensePlate("29A-12345");
        request.setVehicleFeatures("GPS, Bluetooth");
        request.setVehicleImages("img1.jpg,img2.jpg");
        request.setFuelType("GASOLINE");
        request.setNumberSeat(2);
        request.setCostPerDay(new BigDecimal("100000"));
        // Các trường khác giữ nguyên hoặc hợp lệ

        Mockito.when(vehicleRentService.createVehicle(Mockito.any(VehicleRentCreateDTO.class)))
                .thenReturn(mockVehicleGetDTO);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }


    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_Bicycle_SuccessWithoutBrandModelLicensePlate() throws Exception {
        request.setVehicleType("BICYCLE");
        request.setBrandId(null);
        request.setModelId(null);
        request.setLicensePlate(null);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);

        Mockito.when(vehicleRentService.createVehicle(Mockito.any(VehicleRentCreateDTO.class)))
                .thenReturn(mockVehicleGetDTO);

        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidVehicleTypeEnum() throws Exception {
        request.setVehicleType("PLANE"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidHaveDriverEnum_successButNull() throws Exception {
        request.setHaveDriver("MAYBE"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidInsuranceStatusEnum_successButNull() throws Exception {
        request.setInsuranceStatus("MAYBE"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidShipToAddressEnum_successButNull() throws Exception {
        request.setShipToAddress("SOMETIMES"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidTransmissionEnum_successButNull() throws Exception {
        request.setTransmission("SEMI-AUTO"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidFuelTypeEnum_successButNull() throws Exception {
        request.setFuelType("DIESEL"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerVehicle_InvalidStatusEnum_successButNull() throws Exception {
        request.setStatus("BROKEN"); // Không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/vehicle-rent/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").isEmpty())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Vehicle registered successfully"));
    }

    // --- BẮT ĐẦU BỔ SUNG TEST CHO CÁC ENDPOINT KHÁC ---

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void getUserVehicles_success() throws Exception {
        var pageResponse = new PageResponseDTO<com.rft.rft_be.dto.vehicle.VehicleGetDTO>();
        Mockito.when(vehicleRentService.getProviderCar(Mockito.anyInt(), Mockito.anyInt(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(pageResponse);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-vehicles")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt")
                        .param("sortDir", "desc"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void getUserVehicles_fail() throws Exception {
        Mockito.when(vehicleRentService.getProviderCar(Mockito.anyInt(), Mockito.anyInt(), Mockito.anyString(), Mockito.anyString()))
                .thenThrow(new RuntimeException("error!"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/my-vehicles"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void getVehicleById_success() throws Exception {
        Mockito.when(vehicleRentService.getVehicleById(Mockito.anyString())).thenReturn(new VehicleDetailDTO());
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/vehicleId123"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void getVehicleById_fail() throws Exception {
        Mockito.when(vehicleRentService.getVehicleById(Mockito.anyString())).thenThrow(new RuntimeException("not found"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/vehicleId123"))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void updateVehicle_success() throws Exception {
        Mockito.when(vehicleRentService.updateVehicle(Mockito.anyString(), Mockito.any(VehicleRentUpdateDTO.class)))
                .thenReturn(mockVehicleGetDTO);
        VehicleRentUpdateDTO updateDTO = new VehicleRentUpdateDTO();
        ObjectMapper objectMapper = new ObjectMapper();
        String content = objectMapper.writeValueAsString(updateDTO);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/vehicleId123")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void updateVehicle_fail() throws Exception {
        Mockito.when(vehicleRentService.updateVehicle(Mockito.anyString(), Mockito.any(VehicleRentUpdateDTO.class)))
                .thenThrow(new RuntimeException("update fail"));
        VehicleRentUpdateDTO updateDTO = new VehicleRentUpdateDTO();
        ObjectMapper objectMapper = new ObjectMapper();
        String content = objectMapper.writeValueAsString(updateDTO);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/vehicleId123")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void countUserVehicles_success() throws Exception {
        Mockito.when(vehicleRentService.countUserVehicles(Mockito.anyString())).thenReturn(5L);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/count").header("User-Id", "testUserId"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true))
                .andExpect(MockMvcResultMatchers.jsonPath("$.data").value(5));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void countUserVehicles_fail() throws Exception {
        Mockito.when(vehicleRentService.countUserVehicles(Mockito.anyString())).thenThrow(new RuntimeException("fail count"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vehicle-rent/count").header("User-Id", "testUserId"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void toggleVehicleStatus_success() throws Exception {
        Mockito.when(vehicleRentService.toggleVehicleStatus(Mockito.anyString())).thenReturn(mockVehicleGetDTO);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/vehicleId123/toggle-status")
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void toggleVehicleStatus_fail() throws Exception {
        Mockito.when(vehicleRentService.toggleVehicleStatus(Mockito.anyString())).thenThrow(new RuntimeException("toggle fail"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vehicle-rent/vehicleId123/toggle-status")
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerBulk_success() throws Exception {
        Mockito.when(vehicleRentService.createVehicle(Mockito.any(VehicleRentCreateDTO.class))).thenReturn(mockVehicleGetDTO);
        ObjectMapper objectMapper = new ObjectMapper();
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/registerBulk")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(mockVehicleGetDTO.getId()));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerBulk_runtimeException() throws Exception {
        Mockito.when(vehicleRentService.createVehicle(Mockito.any(VehicleRentCreateDTO.class))).thenThrow(new RuntimeException("bulk error"));
        ObjectMapper objectMapper = new ObjectMapper();
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/registerBulk")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("bulk error"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"PROVIDER"})
    void registerBulk_exception() throws Exception {
        Mockito.when(vehicleRentService.createVehicle(Mockito.any(VehicleRentCreateDTO.class)))
            .thenThrow(new RuntimeException("bulk fail"));
        ObjectMapper objectMapper = new ObjectMapper();
        String content = objectMapper.writeValueAsString(request);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vehicle-rent/registerBulk")
                    .contentType(MediaType.APPLICATION_JSON_VALUE)
                    .content(content)
                    .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(MockMvcResultMatchers.status().isBadRequest())
            .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("bulk fail"));
    }

}
