package com.rft.rft_be.controller;


import com.rft.rft_be.service.booking.BookingService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
public class CancelBookingControllerTest {
    @Autowired
    private MockMvc mvc;
    @MockBean
    private BookingService bookingService;


    @Test
    void testCancelBooking() {
        log.info("testCancelBooking");
    }
}
