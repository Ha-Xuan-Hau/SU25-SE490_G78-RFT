package com.rft.rft_be.controller;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.service.rating.RatingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class RatingControllerTest {

    @Mock
    private RatingService ratingService;

    @InjectMocks
    private RatingController ratingController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private RatingDTO sampleRatingDTO;
    private UserCommentDTO sampleComment;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(ratingController).build();
        objectMapper = new ObjectMapper();

        sampleRatingDTO = new RatingDTO();
        sampleRatingDTO.setId("rating1");
        sampleRatingDTO.setUserId("user1");
        sampleRatingDTO.setVehicleId("vehicle1");
        sampleRatingDTO.setBookingId("booking1");
        sampleRatingDTO.setComment("Good ride");
        sampleRatingDTO.setStar(5);

        sampleComment = new UserCommentDTO();
        sampleComment.setComment("Nice");
        sampleComment.setStar(4);
    }

    @Test
    void testCreateOrUpdateRating() throws Exception {
        when(ratingService.createOrUpdateRating(any(RatingDTO.class))).thenReturn(sampleRatingDTO);

        mockMvc.perform(post("/api/ratings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRatingDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("rating1"))
                .andExpect(jsonPath("$.comment").value("Good ride"));

        verify(ratingService, times(1)).createOrUpdateRating(any(RatingDTO.class));
    }

    @Test
    void testDeleteRating() throws Exception {
        doNothing().when(ratingService).deleteRating("rating1");

        mockMvc.perform(delete("/api/ratings/rating1"))
                .andExpect(status().isNoContent());

        verify(ratingService, times(1)).deleteRating("rating1");
    }

    @Test
    void testGetRatingsByUserId() throws Exception {
        when(ratingService.getRatingsByUserId("user1")).thenReturn(List.of(sampleRatingDTO));

        mockMvc.perform(get("/api/ratings/user/user1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("rating1"));

        verify(ratingService, times(1)).getRatingsByUserId("user1");
    }

    @Test
    void testGetRatingsByVehicleId() throws Exception {
        when(ratingService.getRatingsByVehicleId("vehicle1")).thenReturn(List.of(sampleRatingDTO));

        mockMvc.perform(get("/api/ratings/vehicle/vehicle1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("rating1"));

        verify(ratingService, times(1)).getRatingsByVehicleId("vehicle1");
    }

    @Test
    void testGetUserCommentsByVehicleId() throws Exception {
        when(ratingService.getUserCommentsByVehicleId("vehicle1")).thenReturn(List.of(sampleComment));

        mockMvc.perform(get("/api/ratings/vehicle/vehicle1/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].comment").value("Nice"))
                .andExpect(jsonPath("$[0].star").value(4));

        verify(ratingService, times(1)).getUserCommentsByVehicleId("vehicle1");
    }
}
