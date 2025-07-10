package com.rft.rft_be.controller;

import com.rft.rft_be.dto.booking.CancelBookingRequestDTO;
import com.rft.rft_be.dto.booking.CancelBookingResponseDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.service.booking.BookingService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class CancelBookingControllerTest {

   @Autowired
   private MockMvc mockMvc;

   @MockBean
   private BookingService bookingService;

   @Test
   void cancelBooking_success() throws Exception {
       // GIVEN
       CancelBookingResponseDTO responseDTO = new CancelBookingResponseDTO();
       // set các trường cho responseDTO nếu cần
       Mockito.when(bookingService.cancelBooking(anyString(), anyString(), any(CancelBookingRequestDTO.class)))
               .thenReturn(responseDTO);

       String json = "{ \"reason\": \"Khách bận\", \"userType\": \"USER\", \"createFinalContract\": false }";

       // WHEN // THEN
       mockMvc.perform(MockMvcRequestBuilders.post("/api/bookings/booking123/cancel")
                       .header("Authorization", "Bearer testtoken")
                       .contentType(MediaType.APPLICATION_JSON)
                       .content(json)
                       .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
               .andExpect(MockMvcResultMatchers.status().isOk());
   }

   @Test
   void cancelBooking_missingToken_forbidden() throws Exception {
       String json = "{ \"reason\": \"Khách bận\", \"userType\": \"USER\", \"createFinalContract\": false }";
       // WHEN // THEN
       mockMvc.perform(MockMvcRequestBuilders.post("/api/bookings/booking123/cancel")
                       .contentType(MediaType.APPLICATION_JSON)
                       .content(json))
               .andExpect(MockMvcResultMatchers.status().isBadRequest());
   }

   @Test
   void cancelBooking_serviceThrowsException_internalServerError() throws Exception {
       // GIVEN
       Mockito.when(bookingService.cancelBooking(anyString(), anyString(), any(CancelBookingRequestDTO.class)))
               .thenThrow(new RuntimeException("Lỗi khi hủy booking"));

       String json = "{ \"reason\": \"Khách bận\", \"userType\": \"USER\", \"createFinalContract\": false }";

       // WHEN // THEN
       mockMvc.perform(MockMvcRequestBuilders.post("/api/bookings/booking123/cancel")
                       .header("Authorization", "Bearer testtoken")
                       .contentType(MediaType.APPLICATION_JSON)
                       .content(json)
                       .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
               .andExpect(MockMvcResultMatchers.status().isBadRequest());
   }
}
