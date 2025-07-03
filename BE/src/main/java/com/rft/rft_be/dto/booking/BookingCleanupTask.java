package com.rft.rft_be.dto.booking;

import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class BookingCleanupTask {

    private final BookingRepository bookingRepository;
    private final BookedTimeSlotRepository bookedTimeSlotRepository;


    @Value("${booking.cleanup-delay-ms:900000}")// default 15 phút nếu 0 config
    private long cleanupDelayMs;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public BookingCleanupTask(
            BookingRepository bookingRepository,
            BookedTimeSlotRepository bookedTimeSlotRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookedTimeSlotRepository = bookedTimeSlotRepository;
    }

    public void scheduleCleanup(String bookingId) {
        scheduler.schedule(() -> {
            Optional<Booking> optionalBooking = bookingRepository.findById(bookingId);
            optionalBooking.ifPresent(booking -> {
                if (booking.getStatus() == Booking.Status.UNPAID) {
                    // Xoá booking và time slot
                    bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                            booking.getVehicle().getId(),
                            booking.getTimeBookingStart(),
                            booking.getTimeBookingEnd()
                    );
                    bookingRepository.delete(booking);
                    System.out.println("Booking " + bookingId + " bị xoá vì không thanh toán.");
                }
            });
        }, cleanupDelayMs, TimeUnit.MILLISECONDS);
    }
}