package com.rft.rft_be.service.booking;

import java.time.LocalDateTime;
import java.util.List;

import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;

public interface BookingService {

    BookingResponseDTO createBooking(BookingRequestDTO request, String userId);

    void confirmBooking(String bookingId, String token);

    void cancelBooking(String bookingId, String token);

    void deliverVehicle(String bookingId, String token);

    void receiveVehicle(String bookingId, String token);

    void returnVehicle(String bookingId, String token);

    void completeBooking(String bookingId, String token);

    List<BookingResponseDTO> getAllBookings();

    BookingResponseDTO getBookingById(String bookingId);

    List<BookingDTO> getBookingsByStatus(String status);

    List<BookingDTO> getBookingsByUserIdAndDateRange(String userId, LocalDateTime startDate, LocalDateTime endDate);

    List<BookingDTO> getBookingsByUserId(String userId);

    List<BookingDTO> getBookingsByUserIdAndStatus(String userId, String status);

    void payBookingWithWallet(String bookingId, String token);

    boolean isTimeSlotAvailable(String vehicleId, LocalDateTime startTime, LocalDateTime endTime);

}
