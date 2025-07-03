package com.rft.rft_be.service.booking;


import com.nimbusds.jwt.SignedJWT;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.booking.BookingCleanupTask;
import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.BookedTimeSlot;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;

import com.rft.rft_be.mapper.BookingMapper;

import com.rft.rft_be.mapper.BookingResponseMapper;
import com.rft.rft_be.mapper.VehicleMapper;

import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
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
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    BookingResponseMapper bookingResponseMapper;
    BookingCleanupTask bookingCleanupTask;

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + userId));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe với ID: " + request.getVehicleId()));

        if (userId.equals(vehicle.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể đặt xe của chính mình.");
        }

        Instant start = request.getTimeBookingStart();
        Instant end = request.getTimeBookingEnd();

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        // check xe đã được đặt trong thời gian đó chưa
        List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(vehicle.getId(), start, end);
        if (!overlaps.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã được đặt trong khoảng thời gian này.");
        }

        // check renter đã có booking chưa huỷ hoặc chưa bị xoá cho chuyến tương tự chưa
        boolean hasActiveBookingForTrip = bookingRepository.existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(
                userId,
                vehicle.getId(),
                start,
                end,
                List.of(Booking.Status.UNPAID, Booking.Status.PENDING, Booking.Status.CONFIRMED)
        );
        if (hasActiveBookingForTrip) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có một booking đang tồn tại cho chuyến đi này.");
        }

        // Tính tổng chi phí
        long durationHours = Duration.between(start, end).toHours();
        BigDecimal numberOfDays = BigDecimal.valueOf(Math.ceil((double) durationHours / 24));
        BigDecimal totalCost = (vehicle.getCostPerDay() != null)
                ? vehicle.getCostPerDay().multiply(numberOfDays)
                : BigDecimal.ZERO;

        String generatedCodeTransaction = "BOOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Instant transactionTime = Instant.now();

        Booking booking = Booking.builder()
                .user(user)
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .vehicle(vehicle)
                .timeBookingStart(start)
                .timeBookingEnd(end)
                .status(Booking.Status.UNPAID)
                .totalCost(totalCost)
                .codeTransaction(generatedCodeTransaction)
                .timeTransaction(transactionTime)
                .penaltyType(Booking.PenaltyType.valueOf(request.getPenaltyType()))
                .penaltyValue(request.getPenaltyValue())
                .minCancelHour(request.getMinCancelHour())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        bookingRepository.save(booking);
        bookingCleanupTask.scheduleCleanup(booking.getId());

        // lưu time slot đã đặt để tránh đặt trùng
        BookedTimeSlot slot = BookedTimeSlot.builder()
                .vehicle(vehicle)
                .timeFrom(start)
                .timeTo(end)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        bookedTimeSlotRepository.save(slot);

        return bookingResponseMapper.toResponseDTO(booking);
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

    @Override
    @Transactional
    public void confirmBooking(String bookingId, String token) {
        String currentUserId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getVehicle().getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ chủ xe mới được xác nhận đơn đặt xe này");
        }
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái PENDING mới được xác nhận.");
        }
        booking.setStatus(Booking.Status.CONFIRMED);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void deliverVehicle(String bookingId, String token) {
        String currentUserId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getVehicle().getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ chủ xe mới được phép giao xe.");
        }
        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái CONFIRMED mới được giao xe.");
        }
        booking.setStatus(Booking.Status.DELIVERED);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void receiveVehicle(String bookingId, String token) {
        String currentUserId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ người thuê xe mới được xác nhận đã nhận xe.");
        }
        if (booking.getStatus() != Booking.Status.DELIVERED) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái DELIVERED mới được xác nhận đã nhận xe.");
        }
        booking.setStatus(Booking.Status.RECEIVED_BY_CUSTOMER);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void returnVehicle(String bookingId, String token) {
        String currentUserId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ người thuê xe mới được trả xe.");
        }
        if (booking.getStatus() != Booking.Status.RECEIVED_BY_CUSTOMER) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái RECEIVED_BY_CUSTOMER mới được trả xe.");
        }
        booking.setStatus(Booking.Status.RETURNED);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void completeBooking(String bookingId, String token) {
        String currentUserId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ người thuê xe mới được hoàn tất đơn đặt.");
        }
        if (booking.getStatus() != Booking.Status.RETURNED) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái RETURNED mới được hoàn tất.");
        }
        booking.setStatus(Booking.Status.COMPLETED);
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void cancelBooking(String bookingId, String token) {
        String currentUserId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        boolean isRenter = booking.getUser().getId().equals(currentUserId);
        boolean isProvider = booking.getVehicle().getUser().getId().equals(currentUserId);

        if (!isRenter && !isProvider) {
            throw new AccessDeniedException("Chỉ người thuê xe hoặc chủ xe mới có quyền hủy đơn đặt.");
        }

        if (booking.getStatus() == Booking.Status.DELIVERED ||
                booking.getStatus() == Booking.Status.RECEIVED_BY_CUSTOMER ||
                booking.getStatus() == Booking.Status.RETURNED ||
                booking.getStatus() == Booking.Status.COMPLETED) {
            throw new IllegalStateException("Không thể hủy đơn đặt khi đã giao, nhận, trả hoặc hoàn tất.");
        }

        if (isRenter) {
            Instant now = Instant.now();
            long hoursUntilStart = ChronoUnit.HOURS.between(now, booking.getTimeBookingStart());
            Integer minCancelHour = booking.getMinCancelHour();

            if (minCancelHour != null && hoursUntilStart < minCancelHour) {
                BigDecimal penalty = calculatePenalty(booking);
                booking.setPenaltyValue(penalty);
            } else {
                booking.setPenaltyValue(BigDecimal.ZERO);
            }
        }

        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);
    }

    private BigDecimal calculatePenalty(Booking booking) {
        if (booking.getPenaltyType() == Booking.PenaltyType.FIXED) {
            return booking.getPenaltyValue() != null ? booking.getPenaltyValue() : BigDecimal.ZERO;
        } else if (booking.getPenaltyType() == Booking.PenaltyType.PERCENT) {
            if (booking.getPenaltyValue() == null || booking.getTotalCost() == null) return BigDecimal.ZERO;
            return booking.getTotalCost()
                    .multiply(booking.getPenaltyValue())
                    .divide(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }

    private Booking getBookingOrThrow(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingId));
    }

    private String extractUserIdFromToken(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet().getStringClaim("userId");
        } catch (ParseException e) {
            throw new RuntimeException("Không thể lấy userId từ token", e);
        }
    }
}