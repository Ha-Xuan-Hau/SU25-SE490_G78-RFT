package com.rft.rft_be.service.bookingTimeSlot;

import com.rft.rft_be.dto.booking.BookedSlotResponse;

import java.util.List;

public interface BookedTimeSlotService {
    List<BookedSlotResponse> getBookingSlotByVehicleId(String vehicleId);
}
