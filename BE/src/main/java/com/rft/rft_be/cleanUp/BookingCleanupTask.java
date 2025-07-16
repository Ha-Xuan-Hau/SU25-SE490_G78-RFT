package com.rft.rft_be.cleanUp;

import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.service.BookingCleanupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class BookingCleanupTask {


    private final BookingRepository bookingRepository;
    private final ApplicationContext applicationContext; // inject thêm
    private final BookingCleanupService bookingCleanupService;

    @Value("${booking.cleanup-delay-ms:900000}")
    private long cleanupDelayMs;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public BookingCleanupTask(BookingRepository bookingRepository,
                              BookingCleanupService bookingCleanupService,
                              ApplicationContext applicationContext) {
        this.bookingRepository = bookingRepository;
        this.bookingCleanupService = bookingCleanupService;
        this.applicationContext = applicationContext;
    }

    public void scheduleCleanup(String bookingId) {
        scheduler.schedule(() -> {
            Optional<Booking> optionalBooking = bookingRepository.findByIdWithUserAndVehicle(bookingId);
            optionalBooking.ifPresent(booking -> {
                if (booking.getStatus() == Booking.Status.UNPAID) {
                    applicationContext
                            .getBean(BookingCleanupService.class)
                            .deleteBookingAndSlotsTransactional(booking);

                    log.info("Booking {} bị xoá vì không thanh toán.", bookingId);
                }
            });
        }, cleanupDelayMs, TimeUnit.MILLISECONDS);

        log.info("Đã lên lịch cleanup cho booking {} sau {} ms", bookingId, cleanupDelayMs);
    }
}