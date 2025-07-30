package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.driverLicense.CreateDriverLicenseDTO;
import com.rft.rft_be.dto.driverLicense.DriverLicenseDTO;
import com.rft.rft_be.service.DriverLicense.DriverLicenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class DriverLicenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DriverLicenseService driverLicenseService;

    private DriverLicenseDTO mockDriverLicense;
    private CreateDriverLicenseDTO mockCreateDriverLicenseDTO;
    private List<DriverLicenseDTO> mockDriverLicenseList;

    private static final String TEST_USER_ID = "user-001";

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());

        // Setup SecurityContext mock for JWT authentication
        SecurityContext securityContext = mock(SecurityContext.class);
        JwtAuthenticationToken jwtAuthenticationToken = mock(JwtAuthenticationToken.class);
        Jwt jwt = mock(Jwt.class);
        
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        when(jwt.getClaim("userId")).thenReturn(TEST_USER_ID);
        
        SecurityContextHolder.setContext(securityContext);

        // Setup mock data
        mockDriverLicense = DriverLicenseDTO.builder()
                .id("license-001")
                .userId(TEST_USER_ID)
                .userName("John Doe")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("VALID")
                .image("license-image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        mockCreateDriverLicenseDTO = CreateDriverLicenseDTO.builder()
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("VALID")
                .image("license-image-url")
                .build();

        mockDriverLicenseList = Arrays.asList(
                mockDriverLicense,
                DriverLicenseDTO.builder()
                        .id("license-002")
                        .userId("user-002")
                        .userName("Jane Smith")
                        .licenseNumber("B1-789012")
                        .classField("B1")
                        .status("VALID")
                        .image("license-image-url-2")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );
    }

    // ==================== GET ALL DRIVER LICENSES TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getAllDriverLicenses_shouldReturnOk() throws Exception {
        when(driverLicenseService.getAllDriverLicenses()).thenReturn(mockDriverLicenseList);

        mockMvc.perform(get("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("license-001"))
                .andExpect(jsonPath("$[0].licenseNumber").value("B2-123456"))
                .andExpect(jsonPath("$[0].status").value("VALID"))
                .andExpect(jsonPath("$[1].id").value("license-002"))
                .andExpect(jsonPath("$[1].licenseNumber").value("B1-789012"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllDriverLicenses_emptyList_shouldReturnOk() throws Exception {
        when(driverLicenseService.getAllDriverLicenses()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllDriverLicenses_serviceThrowsException_shouldReturnInternalServerError() throws Exception {
        when(driverLicenseService.getAllDriverLicenses()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to retrieve driver licenses: Database error"));
    }

    // ==================== GET DRIVER LICENSE BY ID TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseById_shouldReturnOk() throws Exception {
        when(driverLicenseService.getDriverLicenseById("license-001")).thenReturn(mockDriverLicense);

        mockMvc.perform(get("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("license-001"))
                .andExpect(jsonPath("$.userId").value("user-001"))
                .andExpect(jsonPath("$.userName").value("John Doe"))
                .andExpect(jsonPath("$.licenseNumber").value("B2-123456"))
                .andExpect(jsonPath("$.classField").value("B2"))
                .andExpect(jsonPath("$.status").value("VALID"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseById_notFound_shouldReturnNotFound() throws Exception {
        when(driverLicenseService.getDriverLicenseById("non-existent"))
                .thenThrow(new RuntimeException("Driver license not found"));

        mockMvc.perform(get("/api/driver-licenses/non-existent")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Driver license not found"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseById_serviceThrowsRuntimeException_shouldReturnNotFound() throws Exception {
        when(driverLicenseService.getDriverLicenseById("license-001"))
                .thenThrow(new RuntimeException("Internal error"));

        mockMvc.perform(get("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Internal error"));
    }

    // ==================== GET DRIVER LICENSES BY USER ID TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByUserId_shouldReturnOk() throws Exception {
        when(driverLicenseService.getDriverLicensesByUserId("user-001")).thenReturn(mockDriverLicenseList);

        mockMvc.perform(get("/api/driver-licenses/user/user-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].userId").value("user-001"))
                .andExpect(jsonPath("$[1].userId").value("user-002"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByUserId_emptyList_shouldReturnOk() throws Exception {
        when(driverLicenseService.getDriverLicensesByUserId("user-999")).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/driver-licenses/user/user-999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByUserId_serviceThrowsException_shouldReturnInternalServerError() throws Exception {
        when(driverLicenseService.getDriverLicensesByUserId("user-001"))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/driver-licenses/user/user-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to retrieve driver licenses for user: Database error"));
    }

    // ==================== GET DRIVER LICENSES BY STATUS TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByStatus_valid_shouldReturnOk() throws Exception {
        when(driverLicenseService.getDriverLicensesByStatus("VALID")).thenReturn(mockDriverLicenseList);

        mockMvc.perform(get("/api/driver-licenses/status/VALID")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("VALID"))
                .andExpect(jsonPath("$[1].status").value("VALID"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByStatus_expired_shouldReturnOk() throws Exception {
        List<DriverLicenseDTO> expiredLicenses = Arrays.asList(
                DriverLicenseDTO.builder()
                        .id("license-003")
                        .userId("user-003")
                        .userName("Bob Wilson")
                        .licenseNumber("B2-345678")
                        .classField("B2")
                        .status("EXPIRED")
                        .image("license-image-url-3")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );

        when(driverLicenseService.getDriverLicensesByStatus("EXPIRED")).thenReturn(expiredLicenses);

        mockMvc.perform(get("/api/driver-licenses/status/EXPIRED")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("EXPIRED"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByStatus_invalidStatus_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.getDriverLicensesByStatus("INVALID_STATUS"))
                .thenThrow(new RuntimeException("Invalid status: INVALID_STATUS"));

        mockMvc.perform(get("/api/driver-licenses/status/INVALID_STATUS")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status: INVALID_STATUS"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicensesByStatus_serviceThrowsRuntimeException_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.getDriverLicensesByStatus("VALID"))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/driver-licenses/status/VALID")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Database error"));
    }

    // ==================== GET DRIVER LICENSE BY LICENSE NUMBER TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseByLicenseNumber_shouldReturnOk() throws Exception {
        when(driverLicenseService.getDriverLicenseByLicenseNumber("B2-123456")).thenReturn(mockDriverLicense);

        mockMvc.perform(get("/api/driver-licenses/license-number/B2-123456")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("license-001"))
                .andExpect(jsonPath("$.licenseNumber").value("B2-123456"))
                .andExpect(jsonPath("$.classField").value("B2"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseByLicenseNumber_notFound_shouldReturnNotFound() throws Exception {
        when(driverLicenseService.getDriverLicenseByLicenseNumber("B2-999999"))
                .thenThrow(new RuntimeException("Driver license not found"));

        mockMvc.perform(get("/api/driver-licenses/license-number/B2-999999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Driver license not found"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseByLicenseNumber_serviceThrowsRuntimeException_shouldReturnNotFound() throws Exception {
        when(driverLicenseService.getDriverLicenseByLicenseNumber("B2-123456"))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/driver-licenses/license-number/B2-123456")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Database error"));
    }

    // ==================== CREATE DRIVER LICENSE TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void createDriverLicense_shouldReturnCreated() throws Exception {
        when(driverLicenseService.createDriverLicense(any(CreateDriverLicenseDTO.class)))
                .thenReturn(mockDriverLicense);

        mockMvc.perform(post("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockCreateDriverLicenseDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("license-001"))
                .andExpect(jsonPath("$.userId").value("user-001"))
                .andExpect(jsonPath("$.licenseNumber").value("B2-123456"))
                .andExpect(jsonPath("$.classField").value("B2"))
                .andExpect(jsonPath("$.status").value("VALID"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createDriverLicense_validationError_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.createDriverLicense(any(CreateDriverLicenseDTO.class)))
                .thenThrow(new RuntimeException("License number already exists"));

        mockMvc.perform(post("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockCreateDriverLicenseDTO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("License number already exists"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createDriverLicense_serviceThrowsRuntimeException_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.createDriverLicense(any(CreateDriverLicenseDTO.class)))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(post("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockCreateDriverLicenseDTO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Database error"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createDriverLicense_invalidJson_shouldReturnBadRequest() throws Exception {
        mockMvc.perform(post("/api/driver-licenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("invalid json"))
                .andExpect(status().isBadRequest());
    }

    // ==================== UPDATE DRIVER LICENSE TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void updateDriverLicense_shouldReturnOk() throws Exception {
        DriverLicenseDTO updatedLicense = DriverLicenseDTO.builder()
                .id("license-001")
                .userId("user-001")
                .userName("John Doe")
                .licenseNumber("B2-123456")
                .classField("B2")
                .status("EXPIRED")
                .image("updated-license-image-url")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(driverLicenseService.updateDriverLicense(eq("license-001"), any(DriverLicenseDTO.class)))
                .thenReturn(updatedLicense);

        mockMvc.perform(put("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedLicense)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("license-001"))
                .andExpect(jsonPath("$.status").value("EXPIRED"))
                .andExpect(jsonPath("$.image").value("updated-license-image-url"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void updateDriverLicense_notFound_shouldReturnNotFound() throws Exception {
        when(driverLicenseService.updateDriverLicense(eq("non-existent"), any(DriverLicenseDTO.class)))
                .thenThrow(new RuntimeException("Driver license not found"));

        mockMvc.perform(put("/api/driver-licenses/non-existent")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockDriverLicense)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Driver license not found"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void updateDriverLicense_validationError_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.updateDriverLicense(eq("license-001"), any(DriverLicenseDTO.class)))
                .thenThrow(new RuntimeException("Invalid license number format"));

        mockMvc.perform(put("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockDriverLicense)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid license number format"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void updateDriverLicense_serviceThrowsRuntimeException_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.updateDriverLicense(eq("license-001"), any(DriverLicenseDTO.class)))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(put("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockDriverLicense)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Database error"));
    }

    // ==================== DELETE DRIVER LICENSE TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void deleteDriverLicense_shouldReturnNoContent() throws Exception {
        mockMvc.perform(delete("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "USER")
    void deleteDriverLicense_notFound_shouldReturnNotFound() throws Exception {
        doThrow(new RuntimeException("Driver license not found"))
                .when(driverLicenseService).deleteDriverLicense("non-existent");

        mockMvc.perform(delete("/api/driver-licenses/non-existent")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Driver license not found"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void deleteDriverLicense_validationError_shouldReturnBadRequest() throws Exception {
        doThrow(new RuntimeException("Cannot delete active license"))
                .when(driverLicenseService).deleteDriverLicense("license-001");

        mockMvc.perform(delete("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cannot delete active license"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void deleteDriverLicense_serviceThrowsRuntimeException_shouldReturnBadRequest() throws Exception {
        doThrow(new RuntimeException("Database error"))
                .when(driverLicenseService).deleteDriverLicense("license-001");

        mockMvc.perform(delete("/api/driver-licenses/license-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Database error"));
    }

    // ==================== HEALTH CHECK TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void healthCheck_shouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/driver-licenses/health")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("DriverLicenseController"));
    }

    // ==================== COUNT TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCount_shouldReturnOk() throws Exception {
        when(driverLicenseService.getAllDriverLicenses()).thenReturn(mockDriverLicenseList);

        mockMvc.perform(get("/api/driver-licenses/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCount_emptyList_shouldReturnOk() throws Exception {
        when(driverLicenseService.getAllDriverLicenses()).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/driver-licenses/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCount_serviceThrowsException_shouldReturnInternalServerError() throws Exception {
        when(driverLicenseService.getAllDriverLicenses()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/driver-licenses/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to get count: Database error"));
    }

    // ==================== COUNT BY STATUS TESTS ====================

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCountByStatus_valid_shouldReturnOk() throws Exception {
        when(driverLicenseService.getDriverLicensesByStatus("VALID")).thenReturn(mockDriverLicenseList);

        mockMvc.perform(get("/api/driver-licenses/count/status/VALID")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VALID"))
                .andExpect(jsonPath("$.count").value(2));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCountByStatus_expired_shouldReturnOk() throws Exception {
        List<DriverLicenseDTO> expiredLicenses = Arrays.asList(
                DriverLicenseDTO.builder()
                        .id("license-003")
                        .userId("user-003")
                        .userName("Bob Wilson")
                        .licenseNumber("B2-345678")
                        .classField("B2")
                        .status("EXPIRED")
                        .image("license-image-url-3")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );

        when(driverLicenseService.getDriverLicensesByStatus("EXPIRED")).thenReturn(expiredLicenses);

        mockMvc.perform(get("/api/driver-licenses/count/status/EXPIRED")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXPIRED"))
                .andExpect(jsonPath("$.count").value(1));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCountByStatus_invalidStatus_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.getDriverLicensesByStatus("INVALID_STATUS"))
                .thenThrow(new RuntimeException("Invalid status: INVALID_STATUS"));

        mockMvc.perform(get("/api/driver-licenses/count/status/INVALID_STATUS")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status: INVALID_STATUS"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getDriverLicenseCountByStatus_serviceThrowsRuntimeException_shouldReturnBadRequest() throws Exception {
        when(driverLicenseService.getDriverLicensesByStatus("VALID"))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/driver-licenses/count/status/VALID")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Database error"));
    }
}
