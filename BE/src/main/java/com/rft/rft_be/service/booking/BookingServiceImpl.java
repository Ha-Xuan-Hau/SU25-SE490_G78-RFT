package com.rft.rft_be.service.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.rft.rft_be.entity.*;
import com.rft.rft_be.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.nimbusds.jwt.SignedJWT;
import com.rft.rft_be.dto.booking.BookingCleanupTask;
import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.mapper.BookingMapper;
import com.rft.rft_be.mapper.BookingResponseMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.util.BookingCalculationUtils;

import jakarta.persistence.EntityNotFoundException;
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
import java.time.LocalDateTime;
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
    WalletRepository walletRepository;
    WalletTransactionRepository walletTransactionRepository;
    ContractRepository contractRepository;
    CouponRepository couponRepository;

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

        LocalDateTime start = request.getTimeBookingStart();
        LocalDateTime end = request.getTimeBookingEnd();

        // DEBUG: Log giờ VN và UTC
        log.info("Frontend sent - startDate: {}, endDate: {}", request.getTimeBookingStart(), request.getTimeBookingEnd());
        log.info("Converted to Instant (UTC+7) - start: {}, end: {}", start, end);

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        // Validate thời gian trong khung giờ hoạt động (7h-20h)
        validateOperatingHours(start, end);

        // CRITICAL: Double-check availability với pessimistic locking để tránh race condition
        // Sử dụng synchronized block hoặc database-level locking
        BookedTimeSlot bookedSlot;
        synchronized (this) {
            // Check xe đã được đặt trong thời gian đó chưa - kiểm tra lại trong synchronized block
            List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(vehicle.getId(), start, end);
            if (!overlaps.isEmpty()) {
                log.warn("Race condition detected: Vehicle {} already booked for time range {} to {}",
                        vehicle.getId(), start, end);
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã được đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác.");
            }

            // Immediately create BookedTimeSlot để block slot này ngay lập tức
            bookedSlot = BookedTimeSlot.builder()
                    .vehicle(vehicle)
                    .timeFrom(start)
                    .timeTo(end)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            bookedTimeSlotRepository.save(bookedSlot);
            log.info("Created booked time slot for vehicle {} from {} to {}", vehicle.getId(), start, end);
        }

        // Check renter đã có booking chưa huỷ hoặc chưa bị xoá cho chuyến tương tự chưa
        boolean hasActiveBookingForTrip = bookingRepository.existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(
                userId, vehicle.getId(), start, end,
                List.of(Booking.Status.UNPAID, Booking.Status.PENDING, Booking.Status.CONFIRMED)
        );
        if (hasActiveBookingForTrip) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có một booking đang tồn tại cho chuyến đi này.");
        }

        // ===== TÍNH GIÁ THEO LOGIC MỚI =====
        BookingCalculationUtils.RentalCalculation calculation
                = BookingCalculationUtils.calculateRentalDuration(start, end);

        BigDecimal baseCost = BookingCalculationUtils.calculateRentalPrice(calculation, vehicle.getCostPerDay());

        // Thêm phí giao xe (nếu có)
        BigDecimal deliveryCost = BigDecimal.ZERO;
        if ("delivery".equals(request.getPickupMethod())) {
            deliveryCost = BigDecimal.valueOf(50000); // 50k phí giao xe
        }

        BigDecimal totalCostBeforeDiscount = baseCost.add(deliveryCost);
        log.info("Base cost: {}, Delivery cost: {}, Total before discount: {}",
                baseCost, deliveryCost, totalCostBeforeDiscount);

        // ===== XỬ LÝ COUPON =====
        BigDecimal finalTotalCost = totalCostBeforeDiscount;
        Coupon appliedCoupon = null;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getCouponId() != null && !request.getCouponId().trim().isEmpty()) {
            appliedCoupon = validateAndApplyCoupon(request.getCouponId(), totalCostBeforeDiscount);
            if (appliedCoupon != null) {
                // Tính discount amount (giả sử coupon.discount là phần trăm)
                discountAmount = totalCostBeforeDiscount.multiply(appliedCoupon.getDiscount())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                finalTotalCost = totalCostBeforeDiscount.subtract(discountAmount);

                // Đảm bảo không âm
                if (finalTotalCost.compareTo(BigDecimal.ZERO) < 0) {
                    finalTotalCost = BigDecimal.ZERO;
                }

                log.info("Applied coupon: {}, Discount: {}%, Amount: {}, Final cost: {}",
                        appliedCoupon.getName(), appliedCoupon.getDiscount(), discountAmount, finalTotalCost);
            }
        }

        String generatedCodeTransaction = "BOOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDateTime transactionTime = LocalDateTime.now();

        // Tạo booking với giá đã tính toán
        Booking booking = Booking.builder()
                .user(user)
                .vehicle(vehicle)
                .timeBookingStart(start)
                .timeBookingEnd(end)
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .status(Booking.Status.UNPAID)
                .totalCost(finalTotalCost) // Giá sau khi áp dụng coupon
                .codeTransaction(generatedCodeTransaction)
                .timeTransaction(transactionTime)
                .penaltyType(Booking.PenaltyType.valueOf(request.getPenaltyType()))
                .penaltyValue(request.getPenaltyValue())
                .minCancelHour(request.getMinCancelHour())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // DEBUG: Log giá trị sẽ lưu vào DB
        log.info("DEBUG - Values to be saved to DB:");
        log.info("  timeBookingStart (Instant UTC+7): {}", start);
        log.info("  timeBookingEnd (Instant UTC+7): {}", end);
        log.info("  Original VN time: start={}, end={}", request.getTimeBookingStart(), request.getTimeBookingEnd());

        bookingRepository.save(booking);

        // Schedule cleanup task for unpaid booking
        bookingCleanupTask.scheduleCleanup(booking.getId());

        log.info("Booking created successfully with ID: {} and time slot reserved", booking.getId());

        // Tạo response với thông tin chi tiết
        BookingResponseDTO response = bookingResponseMapper.toResponseDTO(booking);

        // Thêm thông tin bổ sung cho response
        if (appliedCoupon != null) {
            response.setCouponId(appliedCoupon.getId());
            response.setDiscountAmount(discountAmount);
        }
        response.setPriceType(calculation.getPriceType());
        response.setRentalDuration(BookingCalculationUtils.formatRentalDuration(calculation));

        return response;
    }

// Thêm method validate mới
    private void validateOperatingHours(LocalDateTime start, LocalDateTime end) {
        // LocalDateTime already in Vietnam time, no need to convert
        int startHour = start.getHour();
        int endHour = end.getHour();
        int startMinute = start.getMinute();
        int endMinute = end.getMinute();

        // DEBUG: Log chi tiết thời gian để debug
        log.info("DEBUG validateOperatingHours - Start VN: {} ({}:{}), End VN: {} ({}:{})",
                start, startHour, startMinute, end, endHour, endMinute);

        // Validate giờ hoạt động (7h-20h30) - cho phép start từ 7-20h, end từ 7-20h30
        if (startHour < 7 || startHour >= 21) {
            log.error("Start hour validation failed: {} (must be 7-20)", startHour);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giờ bắt đầu phải từ 7:00 đến 20:59");
        }

        // End time: cho phép từ 7:00 đến 20:30 (không cho 21:00 trở đi)
        if (endHour < 7 || endHour >= 21) {
            log.error("End hour validation failed: {} (must be 7-20)", endHour);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giờ kết thúc phải từ 7:00 đến 20:30");
        }

        // Validate phút chỉ được :00 hoặc :30
        if ((startMinute != 0 && startMinute != 30) || (endMinute != 0 && endMinute != 30)) {
            log.error("Minute validation failed: start={}:{}, end={}:{}", startHour, startMinute, endHour, endMinute);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian chỉ được chọn theo bước 30 phút (:00 hoặc :30)");
        }

        log.info("Operating hours validation passed");
    }

    private Coupon validateAndApplyCoupon(String couponId, BigDecimal orderAmount) {
        // 1. Kiểm tra coupon tồn tại
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mã giảm giá không tồn tại"));

        // 2. Kiểm tra trạng thái
        if (coupon.getStatus() != Coupon.CouponStatus.VALID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã giảm giá đã hết hạn");
        }

        // 3. Kiểm tra thời gian hết hạn
        if (coupon.getTimeExpired() != null && coupon.getTimeExpired().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã giảm giá đã hết hạn");
        }

        return coupon;
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
    public List<BookingDTO> getBookingsByUserIdAndDateRange(String userId, LocalDateTime startDate, LocalDateTime endDate) {
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

        if (booking.getStatus() == Booking.Status.DELIVERED
                || booking.getStatus() == Booking.Status.RECEIVED_BY_CUSTOMER
                || booking.getStatus() == Booking.Status.RETURNED
                || booking.getStatus() == Booking.Status.COMPLETED) {
            throw new IllegalStateException("Không thể hủy đơn đặt khi đã giao, nhận, trả hoặc hoàn tất.");
        }

        if (isRenter) {
            LocalDateTime now = LocalDateTime.now();
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
            if (booking.getPenaltyValue() == null || booking.getTotalCost() == null) {
                return BigDecimal.ZERO;
            }
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

    @Override
    @Transactional
    public void payBookingWithWallet(String bookingId, String token) {
        String userId = extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);

        if (!booking.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Chỉ người thuê xe mới được phép thanh toán đơn này.");
        }

        if (booking.getStatus() != Booking.Status.UNPAID) {
            throw new IllegalStateException("Chỉ đơn ở trạng thái UNPAID mới được thanh toán.");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ví người dùng."));

        BigDecimal totalCost = booking.getTotalCost();
        if (wallet.getBalance().compareTo(totalCost) < 0) {
            throw new IllegalStateException("Số dư ví không đủ để thanh toán đơn.");
        }

        // Trừ tiền
        wallet.setBalance(wallet.getBalance().subtract(totalCost));
        walletRepository.save(wallet);

        // Ghi log giao dịch
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .user(booking.getUser())
                .amount(totalCost)
                .status(WalletTransaction.Status.APPROVED)
                .build();
        walletTransactionRepository.save(tx);

        // Cập nhật booking
        booking.setStatus(Booking.Status.PENDING);
        bookingRepository.save(booking);

        Contract contract = Contract.builder()
                .booking(booking)
                .user(booking.getUser())
                .status(Contract.Status.PROCESSING)
                .build();
        contractRepository.save(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTimeSlotAvailable(String vehicleId, LocalDateTime startTime, LocalDateTime endTime) {
        // Synchronized để đảm bảo atomic check
        synchronized (this) {
            List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(vehicleId, startTime, endTime);
            boolean available = overlaps.isEmpty();

            log.debug("Checking availability for vehicle {} from {} to {}: {}",
                    vehicleId, startTime, endTime, available ? "AVAILABLE" : "CONFLICT");

            return available;
        }
    }
}
