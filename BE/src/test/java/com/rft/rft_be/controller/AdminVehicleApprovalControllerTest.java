package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.admin.AdminUpdateVehicleStatusDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.service.admin.AdminVehicleApprovalService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminVehicleApprovalController.class)
class AdminVehicleApprovalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminVehicleApprovalService approvalService;

    @Autowired
    private ObjectMapper objectMapper;

    @WithMockUser
    @Test
    void getPendingVehicles_shouldReturnPage() throws Exception {
        VehicleGetDTO vehicleDTO = new VehicleGetDTO(); // giả định có constructor rỗng
        when(approvalService.getPendingVehicles(Optional.of("CAR"), Optional.of("createdAt"), Optional.of("ASC"), 0, 10))
                .thenReturn(new PageImpl<>(List.of(vehicleDTO), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/admin/vehicles/pending")
                        .param("type", "CAR")
                        .param("sortBy", "createdAt")
                        .param("direction", "ASC")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @WithMockUser
    @Test
    void getPendingStats_shouldReturnStats() throws Exception {
        when(approvalService.getPendingStats()).thenReturn(Map.of("car", 3L, "motorbike", 2L, "bicycle", 1L));

        mockMvc.perform(get("/api/admin/vehicles/pending/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.car").value(3));
    }

    @WithMockUser
    @Test
    void getVehicleDetail_shouldReturnVehicle() throws Exception {
        VehicleGetDTO dto = new VehicleGetDTO();
        when(approvalService.getVehicleDetail("veh123")).thenReturn(dto);

        mockMvc.perform(get("/api/admin/vehicles/veh123"))
                .andExpect(status().isOk());
    }

    @WithMockUser
    @Test
    void updateVehicleStatus_shouldReturnOk() throws Exception {
        AdminUpdateVehicleStatusDTO request = new AdminUpdateVehicleStatusDTO();
        request.setVehicleId("veh123");
        request.setStatus(com.rft.rft_be.entity.Vehicle.Status.AVAILABLE);

        mockMvc.perform(put("/api/admin/vehicles/veh123/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(approvalService).updateVehicleStatus(eq("veh123"), any(AdminUpdateVehicleStatusDTO.class));
    }

    @WithMockUser
    @Test
    void updateVehicleStatuses_shouldReturnOk() throws Exception {
        AdminUpdateVehicleStatusDTO dto1 = new AdminUpdateVehicleStatusDTO();
        dto1.setVehicleId("veh1");
        dto1.setStatus(com.rft.rft_be.entity.Vehicle.Status.UNAVAILABLE);
        dto1.setRejectReason("Lỗi đăng ký");

        AdminUpdateVehicleStatusDTO dto2 = new AdminUpdateVehicleStatusDTO();
        dto2.setVehicleId("veh2");
        dto2.setStatus(com.rft.rft_be.entity.Vehicle.Status.AVAILABLE);

        List<AdminUpdateVehicleStatusDTO> requestList = List.of(dto1, dto2);

        mockMvc.perform(put("/api/admin/vehicles/status/batch")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestList)))
                .andExpect(status().isOk());

        verify(approvalService).updateMultipleVehicleStatuses(eq(requestList));
    }
}