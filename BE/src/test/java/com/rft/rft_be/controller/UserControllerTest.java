package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    private UserDTO mockUserDto;
    private UserProfileDTO mockProfileDto;

    @BeforeEach
    void setUp() {
        mockUserDto = new UserDTO();
        mockUserDto.setId("u1");
        mockUserDto.setFullName("Test User");

        mockProfileDto = new UserProfileDTO();
        mockProfileDto.setFullName("Updated User");
    }

    @Test
    void testViewProfile_success() throws Exception {
        Mockito.when(userService.getProfile("u1")).thenReturn(mockUserDto);

        mockMvc.perform(get("/api/users/u1/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("u1"))
                .andExpect(jsonPath("$.fullName").value("Test User"));
    }

    @Test
    void testUpdateProfile_success() throws Exception {
        Mockito.when(userService.updateProfile(eq("u1"), any()))
                .thenReturn(mockProfileDto);

        String json = """
            {
              "fullName": "Updated User"
            }
        """;

        mockMvc.perform(put("/api/users/u1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated User"));
    }

    @Test
    void testGetCurrentUser_success() throws Exception {
        Mockito.when(userService.getUserIdFromToken("mock-token")).thenReturn("u1");
        Mockito.when(userService.getProfile("u1")).thenReturn(mockUserDto);

        mockMvc.perform(get("/api/users/get-user")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("u1"))
                .andExpect(jsonPath("$.fullName").value("Test User"));
    }
}