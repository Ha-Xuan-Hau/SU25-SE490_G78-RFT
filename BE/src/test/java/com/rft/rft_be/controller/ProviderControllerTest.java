package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.user.RegisterProviderRequestDTO;
import com.rft.rft_be.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProviderController.class)
class ProviderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Captor
    private ArgumentCaptor<RegisterProviderRequestDTO> captor;

    @Test
    @WithMockUser
    void registerAsProvider_shouldReturnSuccessMessage() throws Exception {
        RegisterProviderRequestDTO request = RegisterProviderRequestDTO.builder()
                .userId("user123")
                .name("Công ty ABC")
                .vehicleTypes(List.of("CAR", "TRUCK"))
                .openTime("08:00")
                .closeTime("18:00")
                .build();

        mockMvc.perform(post("/api/providers/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().string("Đăng ký trở thành đối tác thành công."));

        verify(userService).registerUserAsProvider(captor.capture());
        RegisterProviderRequestDTO actual = captor.getValue();
        assertEquals(request.getUserId(), actual.getUserId());
        assertEquals(request.getName(), actual.getName());
        assertEquals(request.getVehicleTypes(), actual.getVehicleTypes());
        assertEquals(request.getOpenTime(), actual.getOpenTime());
        assertEquals(request.getCloseTime(), actual.getCloseTime());
    }
}