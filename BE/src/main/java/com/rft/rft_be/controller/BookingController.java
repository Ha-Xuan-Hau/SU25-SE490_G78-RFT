package com.rft.rft_be.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.booking.CancelBookingRequestDTO;
import com.rft.rft_be.dto.booking.CancelBookingResponseDTO;
import com.rft.rft_be.dto.booking.CompleteBookingRequestDTO;
import com.rft.rft_be.service.booking.BookingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Slf4j
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingRequestDTO bookingRequestDTO, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userId");
        BookingResponseDTO bookingResponse = bookingService.createBooking(bookingRequestDTO, userId);
        return new ResponseEntity<>(bookingResponse, HttpStatus.CREATED);
    }

    @PostMapping("/{bookingId}/deliver")
    public ResponseEntity<?> deliverVehicle(@PathVariable String bookingId, @RequestHeader("Authorization") String authHeader) {
        bookingService.deliverVehicle(bookingId, extractToken(authHeader));
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Giao xe thành công");
    }

    @PostMapping("/{bookingId}/receive")
    public ResponseEntity<?> receiveVehicle(@PathVariable String bookingId, @RequestHeader("Authorization") String authHeader) {
        bookingService.receiveVehicle(bookingId, extractToken(authHeader));
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Nhận xe thành công");
    }

    @PostMapping("/{bookingId}/return")
    public ResponseEntity<?> returnVehicle(@PathVariable String bookingId, @RequestHeader("Authorization") String authHeader) {
        bookingService.returnVehicle(bookingId, extractToken(authHeader));
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Trả xe thành công");
    }

    @PostMapping("/{bookingId}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable String bookingId, @RequestHeader("Authorization") String authHeader, @RequestBody CompleteBookingRequestDTO completeRequest) {
        bookingService.completeBooking(bookingId, extractToken(authHeader), completeRequest.getTimeFinish(), completeRequest.getCostSettlement(), completeRequest.getNote());
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Hoàn tất đơn thành công");
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<CancelBookingResponseDTO> cancelBooking(
            @PathVariable String bookingId,
            @RequestBody CancelBookingRequestDTO cancelRequest,
            @RequestHeader("Authorization") String authHeader) {
        CancelBookingResponseDTO response = bookingService.cancelBooking(bookingId, extractToken(authHeader), cancelRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bookingId}/cancel/no-show")
    public ResponseEntity<CancelBookingResponseDTO> cancelBookingByProviderDueToNoShow(@PathVariable String bookingId, @RequestHeader("Authorization") String authHeader, @RequestBody(required = false) Map<String, String> body) {
        String token = extractToken(authHeader);
        String reason = (body != null) ? body.getOrDefault("reason", "") : "";
        CancelBookingResponseDTO response = bookingService.cancelBookingByProviderDueToNoShow(bookingId, token, reason);
        return ResponseEntity.ok(response);
    }

    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new AccessDeniedException("Token không hợp lệ hoặc không tồn tại");
    }

    @PostMapping("/{bookingId}/pay-wallet")
    public ResponseEntity<?> payWithWallet(@PathVariable String bookingId, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        bookingService.payBookingWithWallet(bookingId, token);
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Thanh toán bằng ví thành công");
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
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
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

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<?> getBookingsByProviderId(@PathVariable String providerId) {
        List<BookingDTO> bookings = bookingService.getBookingsByProviderId(providerId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/provider/{providerId}/status/{status}")
    public ResponseEntity<?> getBookingsByProviderIdAndStatus(@PathVariable String providerId, @PathVariable String status) {
        List<BookingDTO> bookings = bookingService.getBookingsByProviderIdAndStatus(providerId, status);
        return ResponseEntity.ok(bookings);
    }

    @PostMapping("/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(@RequestBody Map<String, String> request) {
        String vehicleId = request.get("vehicleId");
        LocalDateTime startTime = LocalDateTime.parse(request.get("startTime"));
        LocalDateTime endTime = LocalDateTime.parse(request.get("endTime"));

        boolean available = bookingService.isTimeSlotAvailable(vehicleId, startTime, endTime);

        Map<String, Object> response = new HashMap<>();
        response.put("available", available);
        response.put("message", available ? "Thời gian có sẵn" : "Thời gian đã được đặt");

        return ResponseEntity.ok(response);
    }

    // Exception handler để đảm bảo conflict errors được handle đúng cách
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", ex.getReason());
        error.put("status", ex.getStatusCode().value());
        error.put("timestamp", LocalDateTime.now());

        // Log conflicts để monitor
        if (ex.getStatusCode().value() == 409) {
            log.warn("Booking conflict detected: {}", ex.getReason());
        }

        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }
}