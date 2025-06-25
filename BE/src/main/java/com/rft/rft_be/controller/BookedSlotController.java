package com.rft.rft_be.controller;

import com.rft.rft_be.dto.booking.BookedSlotResponse;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.service.bookingTimeSlot.BookedTimeSlotService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookedTimeSlot")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookedSlotController {
    BookedTimeSlotService bookedTimeSlotService;
    @GetMapping("/vehicle/{id}")
    public ResponseEntity<List<BookedSlotResponse>> getBookedSlotsByVehicleId(@PathVariable String id) {
        List<BookedSlotResponse> bookedSlot = bookedTimeSlotService.getBookingSlotByVehicleId(id);
        return ResponseEntity.ok(bookedSlot);
    }

}
