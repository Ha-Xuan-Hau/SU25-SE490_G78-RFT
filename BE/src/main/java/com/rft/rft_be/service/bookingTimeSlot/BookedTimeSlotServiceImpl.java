package com.rft.rft_be.service.bookingTimeSlot;

import com.rft.rft_be.dto.booking.BookedSlotResponse;
import com.rft.rft_be.entity.BookedTimeSlot;
import com.rft.rft_be.mapper.BookedTimeSlotMapper;
import com.rft.rft_be.repository.BookedTimeSlotRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookedTimeSlotServiceImpl implements BookedTimeSlotService {
    BookedTimeSlotMapper bookedTimeSlotMapper;
    BookedTimeSlotRepository timeSlotRepository;
    private final BookedTimeSlotRepository bookedTimeSlotRepository;

    @Override
    public List<BookedSlotResponse> getBookingSlotByVehicleId(String vehicleId) {
        Instant now = Instant.now();
        List<BookedTimeSlot> bookedSlot = bookedTimeSlotRepository.findByVehicleIdAndTimeToAfter(vehicleId, now);
        return bookedSlot.stream()
                .map(bookedTimeSlotMapper::toBookedSlotResponseDto)
                .collect(Collectors.toList());
    }
}
