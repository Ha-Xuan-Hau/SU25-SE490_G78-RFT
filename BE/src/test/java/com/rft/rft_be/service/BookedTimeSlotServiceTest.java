package com.rft.rft_be.service;


import com.rft.rft_be.dto.booking.BookedSlotResponse;
import com.rft.rft_be.entity.BookedTimeSlot;
import com.rft.rft_be.mapper.BookedTimeSlotMapper;
import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.service.bookingTimeSlot.BookedTimeSlotServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
public class BookedTimeSlotServiceTest {
    @Mock
    private BookedTimeSlotMapper bookedTimeSlotMapper;

    @Mock
    private BookedTimeSlotRepository bookedTimeSlotRepository;

    @InjectMocks
    private BookedTimeSlotServiceImpl bookedTimeSlotService;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getBookingSlotByVehicleId_shouldReturnMappedSlotResponses() {
        // Arrange
        String vehicleId = "veh123";
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime timeFrom = now.plusHours(1);
        LocalDateTime timeTo = now.plusHours(2);

        BookedTimeSlot slot = new BookedTimeSlot();
        slot.setTimeFrom(timeFrom);
        slot.setTimeTo(timeTo);

        BookedSlotResponse response = BookedSlotResponse.builder()
                .timeFrom(timeFrom)
                .timeTo(timeTo)
                .build();

        when(bookedTimeSlotRepository.findByVehicleIdAndTimeToAfter(eq(vehicleId), any(LocalDateTime.class)))
                .thenReturn(List.of(slot));

        when(bookedTimeSlotMapper.toBookedSlotResponseDto(slot)).thenReturn(response);

        // Act
        List<BookedSlotResponse> result = bookedTimeSlotService.getBookingSlotByVehicleId(vehicleId);

        // Assert
        assertEquals(1, result.size());
        assertEquals(timeFrom, result.get(0).getTimeFrom());
        assertEquals(timeTo, result.get(0).getTimeTo());

        verify(bookedTimeSlotRepository, times(1))
                .findByVehicleIdAndTimeToAfter(eq(vehicleId), any(LocalDateTime.class));
        verify(bookedTimeSlotMapper, times(1)).toBookedSlotResponseDto(slot);
    }
}

