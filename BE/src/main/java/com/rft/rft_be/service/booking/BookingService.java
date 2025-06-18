package com.rft.rft_be.service.booking;

import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;

import java.util.List;

public interface BookingService {
    BookingResponseDTO createBooking(BookingRequestDTO request, String userId);
    void confirmBooking(String bookingId, String currentUserId);
    void cancelBooking(String bookingId, String currentUserId); // <-- THÊM currentUserId
    List<BookingResponseDTO> getAllBookings();
    BookingResponseDTO getBookingById(String bookingId);
}