package com.rft.rft_be.service.booking;

import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import java.time.Instant;

import java.util.List;

public interface BookingService {
    BookingResponseDTO createBooking(BookingRequestDTO request, String userId);
    void confirmBooking(String bookingId, String currentUserId);
    void cancelBooking(String bookingId, String currentUserId); // <-- THÊM currentUserId
    List<BookingResponseDTO> getAllBookings();
    BookingResponseDTO getBookingById(String bookingId);
    List<BookingDTO> getBookingsByStatus(String status);
    List<BookingDTO> getBookingsByUserIdAndDateRange(String userId, Instant startDate, Instant endDate);
    List<BookingDTO> getBookingsByUserId(String userId);
    List<BookingDTO> getBookingsByUserIdAndStatus(String userId, String status);


}