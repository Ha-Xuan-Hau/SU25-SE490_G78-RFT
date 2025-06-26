package com.rft.rft_be.service.booking;


import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.BookedTimeSlot;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;

import com.rft.rft_be.mapper.BookingMapper;

import com.rft.rft_be.mapper.VehicleMapper;

import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;

import java.util.Map;

import java.util.UUID;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingServiceImpl implements BookingService {


    BookingMapper bookingMapper;
    BookingRepository bookingRepository;
    BookedTimeSlotRepository bookedTimeSlotRepository;
    UserRepository userRepository;
    VehicleRepository vehicleRepository;
    VehicleMapper vehicleMapper;

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + userId));
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe với ID: " + request.getVehicleId()));
        if (userId.equals(vehicle.getUser().getId())) { // ngăn chủ xe tự đặt xe
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể đặt xe của chính mình.");
        }

        Instant start = request.getTimeBookingStart();
        Instant end = request.getTimeBookingEnd();

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(
                vehicle.getId(), start, end);
        if (!overlaps.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã được đặt trong khoảng thời gian này.");
        }
        boolean userHasConflictingBooking = bookingRepository.existsByUserIdAndTimeOverlap(userId, start, end);
        if (userHasConflictingBooking) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có một booking khác trong khoảng thời gian này.");
        }

        //  Tính totalCost
        long durationHours = Duration.between(start, end).toHours();
        // làm tròn lên để tính phí (ví dụ: 25 tiếng = 2 ngày)
        BigDecimal numberOfDays = BigDecimal.valueOf(Math.ceil((double) durationHours / 24));
        BigDecimal totalCost = (vehicle.getCostPerDay() != null) ? vehicle.getCostPerDay().multiply(numberOfDays) : BigDecimal.ZERO;

        // 2. Tạo codeTransaction timeTransaction
        String generatedCodeTransaction = "BOOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Instant transactionTime = Instant.now();

        Booking booking = Booking.builder()
                .user(user)
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .vehicle(vehicle)
                .timeBookingStart(start)
                .timeBookingEnd(end)
                .status(Booking.Status.PENDING)
                .totalCost(totalCost)
                .codeTransaction(generatedCodeTransaction)
                .timeTransaction(transactionTime)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        bookingRepository.save(booking);

        BookedTimeSlot slot = BookedTimeSlot.builder()
                .vehicle(vehicle)
                .timeFrom(start)
                .timeTo(end)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        bookedTimeSlotRepository.save(slot);

        return vehicleMapper.mapToBookingResponseDTO(booking);
    }

    @Override
    @Transactional
    public void confirmBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId) // Đảm bảo query này JOIN FETCH cả user và vehicle.user
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));

        // Chỉ chủ xe mới đc xác nhận booking
        // Lấy ID của chủ sở hữu xe
        String vehicleOwnerId = booking.getVehicle().getUser().getId();
        if (!currentUserId.equals(vehicleOwnerId)) {
            throw new AccessDeniedException("Bạn không có quyền xác nhận booking này. Chỉ chủ xe mới được phép.");
        }

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking không ở trạng thái PENDING để xác nhận.");
        }

        booking.setStatus(Booking.Status.CONFIRMED);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void cancelBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));

        // Chỉ người đặt HOẶC chủ xe mới được hủy booking
        String bookerUserId = booking.getUser().getId();
        String vehicleOwnerId = booking.getVehicle().getUser().getId();

        if (!currentUserId.equals(bookerUserId) && !currentUserId.equals(vehicleOwnerId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy booking này. Chỉ người đặt hoặc chủ xe mới được phép.");
        }
        if (booking.getStatus() == Booking.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể hủy Booking đã hoàn tất.");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        // Xóa slot đã đặt khi booking bị hủy
        bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                booking.getVehicle().getId(),
                booking.getTimeBookingStart(),
                booking.getTimeBookingEnd()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAllWithUserAndVehicle();
        return bookings.stream()
                .map(vehicleMapper::mapToBookingResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(String bookingId) {
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));
        return vehicleMapper.mapToBookingResponseDTO(booking);
    }

    @Override
    public List<BookingDTO> getBookingsByStatus(String status) {
        try {
            log.info("Getting bookings by status: {}", status);
            Booking.Status bookingStatus = Booking.Status.valueOf(status.toUpperCase());
            List<Booking> bookings = bookingRepository.findByStatus(bookingStatus);
            return bookings.stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: PENDING, CONFIRMED, CANCELLED, COMPLETED");
        } catch (Exception e) {
            log.error("Error getting bookings by status: {}", status, e);
            throw new RuntimeException("Failed to get bookings by status: " + e.getMessage());
        }
    }

    @Override
    public List<BookingDTO> getBookingsByUserIdAndDateRange(String userId, Instant startDate, Instant endDate) {
        try {
            log.info("Getting bookings for user: {} between {} and {}", userId, startDate, endDate);
            List<Booking> bookings = bookingRepository.findByUserIdAndTimeBookingStartBetween(userId, startDate, endDate);
            return bookings.stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting bookings for user: {} in date range", userId, e);
            throw new RuntimeException("Failed to get bookings by date range: " + e.getMessage());
        }
    }

    @Override
    public List<BookingDTO> getBookingsByUserId(String userId) {
        try {
            log.info("Getting all bookings for user: {}", userId);

            // Validate user exists
            if (!userRepository.existsById(userId)) {
                throw new RuntimeException("User not found with id: " + userId);
            }

            List<Booking> bookings = bookingRepository.findByUserId(userId);
            List<BookingDTO> bookingDTOs = bookings.stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());

            log.info("Found {} bookings for user: {}", bookingDTOs.size(), userId);
            return bookingDTOs;

        } catch (Exception e) {
            log.error("Error getting bookings for user: {}", userId, e);
            throw new RuntimeException("Failed to get bookings for user: " + e.getMessage());
        }
    }
    @Override
    public List<BookingDTO> getBookingsByUserIdAndStatus(String userId, String status) {
        try {
            log.info("Getting bookings for user: {} with status: {}", userId, status);

            // Validate user exists
            if (!userRepository.existsById(userId)) {
                throw new RuntimeException("User not found with id: " + userId);
            }

            // Validate status
            Booking.Status bookingStatus;
            try {
                bookingStatus = Booking.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + status + ". Valid values are: PENDING, CONFIRMED, CANCELLED, COMPLETED");
            }

            List<Booking> bookings = bookingRepository.findByUserIdAndStatus(userId, bookingStatus);
            List<BookingDTO> bookingDTOs = bookings.stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());

            log.info("Found {} bookings for user: {} with status: {}", bookingDTOs.size(), userId, status);
            return bookingDTOs;

        } catch (Exception e) {
            log.error("Error getting bookings for user: {} with status: {}", userId, status, e);
            throw new RuntimeException("Failed to get bookings: " + e.getMessage());
        }
    }


}