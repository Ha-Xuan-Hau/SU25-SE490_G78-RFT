package com.rft.rft_be.service;

import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.BookingDetail;
import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.BookingDetailRepository;
import com.rft.rft_be.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Iterator;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BookingCleanupService {

    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookedTimeSlotRepository bookedTimeSlotRepository;

    @Transactional
    public void deleteBookingAndSlotsTransactional(Booking booking) {
        if (booking.getBookingDetails() != null) {
            Iterator<BookingDetail> iterator = booking.getBookingDetails().iterator();
            for (BookingDetail detail : booking.getBookingDetails()) {
                try {
                    bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                            detail.getVehicle().getId(),
                            booking.getTimeBookingStart(),
                            booking.getTimeBookingEnd()
                    );

                    iterator.remove();

                    bookingDetailRepository.deleteById(detail.getId()); // Xoá từng cái
                } catch (Exception e) {
                    log.error("Lỗi xoá slot hoặc detail cho xe {}: {}", detail.getVehicle().getId(), e.getMessage());
                }
            }
        }

        bookingRepository.delete(booking);
        log.info("✅ Booking {} và toàn bộ slot/detail liên quan đã được xoá.", booking.getId());
    }
}