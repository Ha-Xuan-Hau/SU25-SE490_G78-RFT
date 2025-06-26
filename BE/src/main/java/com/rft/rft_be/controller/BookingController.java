package com.rft.rft_be.controller;

import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.service.booking.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@RequestBody BookingRequestDTO bookingRequestDTO, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userId");
        BookingResponseDTO bookingResponse = bookingService.createBooking(bookingRequestDTO, userId);
        return new ResponseEntity<>(bookingResponse, HttpStatus.CREATED);
    }

    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<Void> confirmBooking(@PathVariable String bookingId, @AuthenticationPrincipal Jwt jwt) {
        String currentUserId = jwt.getClaimAsString("userId");
        bookingService.confirmBooking(bookingId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Void> cancelBooking(@PathVariable String bookingId, @AuthenticationPrincipal Jwt jwt) {
        String currentUserId = jwt.getClaimAsString("userId");
        bookingService.cancelBooking(bookingId, currentUserId);
        return ResponseEntity.ok().build();
    }


    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings() {
        List<BookingResponseDTO> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable String bookingId) {
        BookingResponseDTO booking = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(booking);
    }
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getBookingsByStatus(@PathVariable String status) {
            List<BookingDTO> bookings = bookingService.getBookingsByStatus(status);
            return ResponseEntity.ok(bookings);
    }
    @GetMapping("/user/{userId}/date-range")
    public ResponseEntity<?> getBookingsByUserIdAndDateRange(
            @PathVariable String userId,
            @RequestParam Instant startDate,
            @RequestParam Instant endDate) {
        try {
            List<BookingDTO> bookings = bookingService.getBookingsByUserIdAndDateRange(userId, startDate, endDate);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve bookings by date range: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBookingsByUserId(@PathVariable String userId) {

            List<BookingDTO> bookings = bookingService.getBookingsByUserId(userId);
            return ResponseEntity.ok(bookings);

    }
    @GetMapping("/user/{userId}/status/{status}")
    public ResponseEntity<?> getBookingsByUserIdAndStatus(@PathVariable String userId, @PathVariable String status) {

            List<BookingDTO> bookings = bookingService.getBookingsByUserIdAndStatus(userId, status);
            return ResponseEntity.ok(bookings);

    }
}