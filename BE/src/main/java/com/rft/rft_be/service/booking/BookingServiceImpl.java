package com.rft.rft_be.service.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.rft.rft_be.cleanUp.BookingCleanupTask;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.Notification.NotificationService;
import com.rft.rft_be.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.booking.CancelBookingRequestDTO;
import com.rft.rft_be.dto.booking.CancelBookingResponseDTO;
import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import com.rft.rft_be.mapper.BookingMapper;
import com.rft.rft_be.mapper.BookingResponseMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.service.Contract.FinalContractService;
import com.rft.rft_be.util.BookingCalculationUtils;

import jakarta.persistence.EntityNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

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
    FinalContractService finalContractService;
    BookingDetailRepository bookingDetailRepository;
    PenaltyRepository penaltyRepository;
    NotificationService notificationService;
    NotificationMapper notificationMapper;
    FinalContractRepository finalContractRepository;
    final JwtUtil jwtUtil;

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + userId));

        Penalty vehiclePenaly = penaltyRepository.findById(request.getPenaltyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + userId));

        LocalDateTime start = request.getTimeBookingStart();
        LocalDateTime end = request.getTimeBookingEnd();

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        List<Vehicle> vehicles = vehicleRepository.findAllById(request.getVehicleIds());

        if (vehicles.size() != request.getVehicleIds().size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Một hoặc nhiều xe không tồn tại.");
        }

        // Kiểm tra tất cả cùng 1 chủ xe
        String providerId = vehicles.get(0).getUser().getId();
        for (Vehicle v : vehicles) {
            if (!v.getUser().getId().equals(providerId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tất cả xe trong một đơn phải thuộc cùng một chủ xe.");
            }
            if (userId.equals(v.getUser().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể đặt xe của chính mình.");
            }
            validateOperatingHours(start, end, v);
        }

        // Check trùng booking & slot từng xe
        for (Vehicle vehicle : vehicles) {
            List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(vehicle.getId(), start, end);
            if (!overlaps.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe " + vehicle.getId() + " đã được đặt trong khoảng thời gian này.");
            }

            boolean hasActive = bookingRepository.existsBookingForUserAndVehicleAndTimeRange(
                    userId, vehicle.getId(), start, end,
                    List.of(Booking.Status.UNPAID, Booking.Status.PENDING, Booking.Status.CONFIRMED));
            if (hasActive) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đặt xe " + vehicle.getId() + " cho thời gian này.");
            }
        }

        // Tổng chi phí
        BigDecimal driverFee = BigDecimal.ZERO;
        BigDecimal totalBeforeDiscount = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalFinalCost = BigDecimal.ZERO;
        BookingCalculationUtils.RentalCalculation calculation = BookingCalculationUtils.calculateRentalDuration(start, end);

        for (Vehicle v : vehicles) {
            BigDecimal baseCost = BookingCalculationUtils.calculateRentalPrice(calculation, v.getCostPerDay());
            BigDecimal deliveryCost = "delivery".equals(request.getPickupMethod()) ? BigDecimal.ZERO : BigDecimal.ZERO;
            totalBeforeDiscount = totalBeforeDiscount.add(baseCost.add(deliveryCost));
        }

        // Kiểm tra và cộng phí tài xế nếu có
        if (request.getDriverFee() != null && request.getDriverFee().compareTo(BigDecimal.ZERO) > 0) {
            driverFee = request.getDriverFee();
            totalBeforeDiscount = totalBeforeDiscount.add(driverFee);
        }

        // Áp dụng coupon 1 lần
        Coupon appliedCoupon = null;
        if (request.getCouponId() != null && !request.getCouponId().trim().isEmpty()) {
            appliedCoupon = validateAndApplyCoupon(request.getCouponId(), totalBeforeDiscount);
            totalDiscount = totalBeforeDiscount.multiply(appliedCoupon.getDiscount())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        totalFinalCost = totalBeforeDiscount.subtract(totalDiscount);
        if (totalFinalCost.compareTo(BigDecimal.ZERO) < 0) totalFinalCost = BigDecimal.ZERO;

        // Tạo booking
        Booking booking = Booking.builder()
                .user(user)
                .timeBookingStart(start)
                .timeBookingEnd(end)
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .status(Booking.Status.UNPAID)
                .totalCost(totalFinalCost)
                .codeTransaction("BOOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .timeTransaction(LocalDateTime.now())
                .penaltyType(Booking.PenaltyType.valueOf(vehiclePenaly.getPenaltyType().toString()))
                .penaltyValue(vehiclePenaly.getPenaltyValue())
                .minCancelHour(request.getMinCancelHour())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .coupon(appliedCoupon)
                .build();

        bookingRepository.save(booking);

        // Tạo bookingDetail và block slot
        List<BookingDetail> details = new ArrayList<>();

        // Lấy phí tài xế từ request (nếu có)
        BigDecimal requestDriverFee = (request.getDriverFee() != null) ? request.getDriverFee() : BigDecimal.ZERO;


        for (Vehicle v : vehicles) {
            BigDecimal baseCost = BookingCalculationUtils.calculateRentalPrice(calculation, v.getCostPerDay());

            BookingDetail detail = BookingDetail.builder()
                    .booking(booking)
                    .vehicle(v)
                    .cost(baseCost)
                    .driverFee(requestDriverFee) // Nếu có
                    .build();
            details.add(detail);

            bookedTimeSlotRepository.save(BookedTimeSlot.builder()
                    .vehicle(v)
                    .timeFrom(start)
                    .timeTo(end)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        }

        bookingDetailRepository.saveAll(details);
        booking.setBookingDetails(details);

        bookingCleanupTask.scheduleCleanup(booking.getId());

        String vehicleNames = vehicles.stream()
                .map(Vehicle::getThumb)
                .collect(Collectors.joining(", "));
        notificationService.notifyOrderPlaced(userId, booking.getId(), vehicleNames);
        notificationService.notifyProviderReceivedBooking(providerId, booking.getId(), vehicleNames);


        BookingResponseDTO response = bookingResponseMapper.toResponseDTO(booking);
        response.setDiscountAmount(totalDiscount);
        response.setPriceType(calculation.getPriceType());
        response.setRentalDuration(BookingCalculationUtils.formatRentalDuration(calculation));
        return response;
    }

    // Thêm method validate mới
    private void validateOperatingHours(LocalDateTime start, LocalDateTime end, Vehicle vehicle) {
        User owner = vehicle.getUser();
        LocalTime openTime = owner.getOpenTime().toLocalTime();
        LocalTime closeTime = owner.getCloseTime().toLocalTime();

        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();

        // DEBUG
        log.info("Validate operating hours: open={}, close={}, start={}, end={}", openTime, closeTime, startTime, endTime);

        // Nếu openTime = closeTime = 00:00 => hoạt động 24h, không cần check
        boolean is24h = openTime.equals(LocalTime.MIDNIGHT) && closeTime.equals(LocalTime.MIDNIGHT);

        if (!is24h) {
            if (startTime.isBefore(openTime) || startTime.isAfter(closeTime)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Giờ bắt đầu phải trong khoảng %s đến %s", openTime, closeTime));
            }
            if (endTime.isBefore(openTime) || endTime.isAfter(closeTime)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        String.format("Giờ kết thúc phải trong khoảng %s đến %s", openTime, closeTime));
            }
        }


        // Validate phút chỉ được :00 hoặc :30
        if ((startTime.getMinute() != 0 && startTime.getMinute() != 30)
                || (endTime.getMinute() != 0 && endTime.getMinute() != 30)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian chỉ được chọn theo bước 30 phút (:00 hoặc :30)");
        }
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
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userIdToken = authentication.getToken().getClaim("userId");

        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));

        String renterId = booking.getUser().getId();
        List<BookingDetail> bookingDetails = booking.getBookingDetails();
        if (bookingDetails.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking không có xe nào");
        }
        String providerId = bookingDetails.get(0).getVehicle().getUser().getId();

        // Cho phép nếu là renter hoặc provider
        if (!userIdToken.trim().equals(renterId.trim()) && !userIdToken.trim().equals(providerId.trim())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập tài nguyên này");
        }

        BookingResponseDTO dto = vehicleMapper.mapToBookingResponseDTO(booking);

        // Lấy cancelNote nếu có
        Optional<String> cancelNoteOpt = finalContractRepository.findCancelNoteByBookingId(bookingId);
        dto.setCancelNote(cancelNoteOpt.orElse(null));

        return dto;
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
    public List<BookingDTO> getBookingsByProviderId(String providerId) {
        List<Booking> bookings = bookingRepository.findByProviderId(providerId);
        return bookings.stream()
                .map(bookingMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingDTO> getBookingsByProviderIdAndStatus(String providerId, String status) {
        try {
            Booking.Status bookingStatus = Booking.Status.valueOf(status.toUpperCase());
            List<Booking> bookings = bookingRepository.findByProviderIdAndStatus(providerId, bookingStatus);
            return bookings.stream()
                    .map(bookingMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking status: " + status);
        }
    }

    @Override
    @Transactional
    public void confirmBooking(String bookingId, String token) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (booking.getBookingDetails().isEmpty()) {
            throw new IllegalStateException("Đơn đặt không chứa xe nào.");
        }
        String providerId = booking.getBookingDetails().get(0).getVehicle().getUser().getId();
        if (!providerId.equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ chủ xe mới được xác nhận đơn đặt xe này");
        }
        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái PENDING mới được xác nhận.");
        }
        booking.setStatus(Booking.Status.CONFIRMED);
        bookingRepository.save(booking);
        notificationService.notifyOrderApproved(booking.getUser().getId(), booking.getId());


        Contract contract = new Contract();
        contract.setUser(booking.getBookingDetails().get(0).getVehicle().getUser());
        contract.setBooking(booking);
        contract.setCostSettlement(booking.getTotalCost());
        contract.setStatus(Contract.Status.PROCESSING);
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());

        contractRepository.save(contract);
    }

    @Override
    @Transactional
    public void deliverVehicle(String bookingId, String token) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (booking.getBookingDetails().isEmpty()) {
            throw new IllegalStateException("Đơn đặt không chứa xe nào.");
        }
        String providerId = booking.getBookingDetails().get(0).getVehicle().getUser().getId();
        if (!providerId.equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ chủ xe mới được phép giao xe.");
        }

        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái CONFIRMED mới được giao xe.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = booking.getTimeBookingStart();
        long hoursUntilStart = ChronoUnit.HOURS.between(now, startTime);

//        if (hoursUntilStart > 8 || hoursUntilStart < 5) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
//                    "Bạn chỉ có thể giao xe trong khoảng từ 5 đến 8 tiếng trước thời gian bắt đầu chuyến đi.");
//        }

        if (hoursUntilStart > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bạn chỉ có thể giao xe trong khoảng từ 8 tiếng trước thời gian bắt đầu chuyến đi.");
        }

        booking.setStatus(Booking.Status.DELIVERED);
        bookingRepository.save(booking);
        Vehicle vehicle = booking.getBookingDetails().get(0).getVehicle();
        notificationService.notifyVehicleHandover(
                booking.getUser().getId(),     // người thuê
                booking.getId(),
                vehicle.getThumb(),             // tên xe
                booking.getAddress()           // địa điểm giao xe
        );
    }

    @Override
    @Transactional
    public void receiveVehicle(String bookingId, String token) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ người thuê xe mới được xác nhận đã nhận xe.");
        }
        if (booking.getStatus() != Booking.Status.DELIVERED) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái DELIVERED mới được xác nhận đã nhận xe.");
        }

        // Update booking status
        booking.setStatus(Booking.Status.RECEIVED_BY_CUSTOMER);
        bookingRepository.save(booking);
        String providerId = booking.getBookingDetails().get(0).getVehicle().getUser().getId();
        String renterName = booking.getUser().getFullName();

        notificationService.notifyVehiclePickupConfirmed(
                providerId, booking.getId(), renterName
        );

        // Update contract status to RENTING when customer receives the vehicle
        List<Contract> contracts = contractRepository.findByBookingId(bookingId);
        if (!contracts.isEmpty()) {
            Contract contract = contracts.get(0);
            contract.setStatus(Contract.Status.RENTING);
            contractRepository.save(contract);
        }
    }

    @Override
    @Transactional
    public void returnVehicle(String bookingId, String token) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);
        if (!booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chỉ người thuê xe mới được trả xe.");
        }
        if (booking.getStatus() != Booking.Status.RECEIVED_BY_CUSTOMER) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái RECEIVED_BY_CUSTOMER mới được trả xe.");
        }
        booking.setStatus(Booking.Status.RETURNED);
        bookingRepository.save(booking);
        String providerId = booking.getBookingDetails().get(0).getVehicle().getUser().getId();
        notificationService.notifyVehicleReturnConfirmed(providerId, booking.getId()
        );
    }

    @Override
    @Transactional
    public void completeBooking(String bookingId, String token,LocalDateTime timeFinish, BigDecimal costSettlement, String note) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);

        if (booking.getStatus() != Booking.Status.RETURNED) {
            throw new IllegalStateException("Chỉ đơn đặt ở trạng thái RETURNED mới được hoàn tất.");
        }
        booking.setStatus(Booking.Status.COMPLETED);
        bookingRepository.save(booking);

        //free bookedTimeSlot
        for (BookingDetail detail : booking.getBookingDetails()) {
            bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                    detail.getVehicle().getId(),
                    booking.getTimeBookingStart(),
                    booking.getTimeBookingEnd()
            );
        }

        String finalContractId = null;
        List<Contract> contracts = contractRepository.findByBookingId(bookingId);
        if (!contracts.isEmpty()) {
            Contract contract = contracts.get(0);
            contract.setStatus(Contract.Status.FINISHED);
            contractRepository.save(contract);

            // Create FinalContract với costSettlement và note từ FE
            CreateFinalContractDTO finalContractDTO = CreateFinalContractDTO.builder()
                    .contractId(contract.getId())
//                    .userId(currentUserId)
                    .timeFinish(timeFinish)
                    .costSettlement(costSettlement)
                    .note(note)
                    .build();

            try {
                var finalContract = finalContractService.createFinalContract(finalContractDTO);
                finalContractId = finalContract.getId();
            } catch (Exception e) {
                log.error("Failed to create final contract for booking {}: {}", bookingId, e.getMessage());
            }
        }
        notificationService.notifyBookingCompleted(booking.getUser().getId(), booking.getId());
    }

    @Override
    @Transactional
    public CancelBookingResponseDTO cancelBooking(String bookingId, String token, CancelBookingRequestDTO cancelRequest) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);

        if (booking.getBookingDetails().isEmpty()) {
            throw new IllegalStateException("Không tìm thấy xe nào trong đơn đặt này.");
        }

        String providerId = booking.getBookingDetails().get(0).getVehicle().getUser().getId();
        boolean isRenter = booking.getUser().getId().equals(currentUserId);
        boolean isProvider = providerId.equals(currentUserId);

        if (!isRenter && !isProvider) {
            throw new AccessDeniedException("Chỉ người thuê xe hoặc chủ xe mới có quyền hủy đơn đặt.");
        }

        if (booking.getStatus() == Booking.Status.RECEIVED_BY_CUSTOMER
                || booking.getStatus() == Booking.Status.RETURNED
                || booking.getStatus() == Booking.Status.COMPLETED) {
            throw new IllegalStateException("Không thể hủy đơn đặt khi đã nhận, trả hoặc hoàn tất.");
        }

        BigDecimal penalty = BigDecimal.ZERO;
        BigDecimal refundAmount = booking.getTotalCost(); // Mặc định: hoàn toàn bộ

        if (isRenter) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startDate = booking.getTimeBookingStart();
            Integer minCancelHour = booking.getMinCancelHour();

            if (startDate != null && minCancelHour != null) {
                long hoursBeforeStart = ChronoUnit.HOURS.between(now, startDate);
                if (hoursBeforeStart < minCancelHour) {
                    penalty = calculatePenalty(booking);
                    booking.setPenaltyValue(penalty);
                    refundAmount = booking.getTotalCost().subtract(penalty);
                } else {
                    booking.setPenaltyValue(BigDecimal.ZERO);
                }
            } else {
                booking.setPenaltyValue(BigDecimal.ZERO);
            }
        } else if (isProvider) {
            booking.setPenaltyValue(BigDecimal.ZERO);
        }

        // 1. Hoàn tiền cho người thuê (nếu có)
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            Wallet renterWallet = walletRepository.findByUserId(booking.getUser().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ví người thuê."));
            renterWallet.setBalance(renterWallet.getBalance().add(refundAmount));
            walletRepository.save(renterWallet);

            WalletTransaction refundTx = WalletTransaction.builder()
                    .wallet(renterWallet)
                    .amount(refundAmount)
                    .status(WalletTransaction.Status.APPROVED)
                    .build();
            walletTransactionRepository.save(refundTx);

            notificationService.notifyRefundAfterCancellation(
                    booking.getUser().getId(),
                    bookingId,
                    refundAmount.doubleValue()
            );
        }

        // 2. Trả phí phạt cho chủ xe (nếu có)
        if (penalty.compareTo(BigDecimal.ZERO) > 0 && isRenter) {
            Wallet providerWallet = walletRepository.findByUserId(providerId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ví chủ xe."));
            providerWallet.setBalance(providerWallet.getBalance().add(penalty));
            walletRepository.save(providerWallet);

            WalletTransaction penaltyTx = WalletTransaction.builder()
                    .wallet(providerWallet)
                    .amount(penalty)
                    .status(WalletTransaction.Status.APPROVED)
                    .build();
            walletTransactionRepository.save(penaltyTx);

            notificationService.notifyPenaltyReceivedAfterCancellation(
                    providerId,
                    bookingId,
                    penalty.doubleValue()
            );
        }

        // 3. Cập nhật trạng thái booking & xoá slot đã đặt
        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);

        for (BookingDetail detail : booking.getBookingDetails()) {
            bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                    detail.getVehicle().getId(),
                    booking.getTimeBookingStart(),
                    booking.getTimeBookingEnd()
            );
        }

        // 4. Hủy hợp đồng + tạo final contract nếu được yêu cầu
        String finalContractId = null;
        List<Contract> contracts = contractRepository.findByBookingId(bookingId);
        if (!contracts.isEmpty()) {
            Contract contract = contracts.get(0);
            contract.setStatus(Contract.Status.CANCELLED);
            contractRepository.save(contract);

            if (cancelRequest.isCreateFinalContract()) {
                CreateFinalContractDTO finalContractDTO = CreateFinalContractDTO.builder()
                        .contractId(contract.getId())
                        .userId(currentUserId)
                        .timeFinish(LocalDateTime.now())
                        .costSettlement(refundAmount)
                        .note("Hủy bởi " + (isRenter ? "khách hàng" : "chủ xe") +
                                (cancelRequest.getReason() != null && !cancelRequest.getReason().isEmpty()
                                        ? ". Lý do: " + cancelRequest.getReason() : ""))
                        .build();
                try {
                    var finalContract = finalContractService.createFinalContract(finalContractDTO);
                    finalContractId = finalContract.getId();
                } catch (Exception e) {
                    log.error("Failed to create final contract for booking {}: {}", bookingId, e.getMessage());
                }
            }
        }

        // 5. Gửi thông báo huỷ đơn hàng cho cả hai phía
        if (isRenter) {
            // Gửi cho renter: chỉ lý do gốc
            notificationService.notifyOrderCanceled(booking.getUser().getId(), bookingId, cancelRequest.getReason());

            // Gửi cho provider: prefix rõ là hủy bởi khách
            notificationService.notifyOrderCanceled(providerId, bookingId, "Khách hàng đã hủy đơn" + (cancelRequest.getReason() != null && !cancelRequest.getReason().isBlank()
                    ? ". Lý do: " + cancelRequest.getReason()
                    : ""));
        } else {
            // Gửi cho provider
            notificationService.notifyOrderCanceled(providerId, bookingId, cancelRequest.getReason());

            // Gửi cho renter
            notificationService.notifyOrderCanceled(booking.getUser().getId(), bookingId, "Chủ xe đã hủy đơn" + (cancelRequest.getReason() != null && !cancelRequest.getReason().isBlank()
                    ? ". Lý do: " + cancelRequest.getReason()
                    : ""));
        }

        // 6. Trả về response
        return CancelBookingResponseDTO.builder()
                .bookingId(bookingId)
                .status(booking.getStatus().toString())
                .contractStatus("CANCELLED")
                .finalContractId(finalContractId)
                .refundAmount(refundAmount)
                .penaltyAmount(penalty)
                .reason(cancelRequest.getReason())
                .message("Hủy đơn đặt xe thành công")
                .build();
    }



    public CancelBookingResponseDTO cancelBookingByProviderDueToNoShow(String bookingId, String token, String reason) {
        String currentUserId = jwtUtil.extractUserIdFromToken(token);
        Booking booking = getBookingOrThrow(bookingId);

        if (booking.getBookingDetails().isEmpty()) {
            throw new IllegalStateException("Không tìm thấy xe nào trong đơn đặt này.");
        }

        String providerId = booking.getBookingDetails().get(0).getVehicle().getUser().getId();
        boolean isProvider = providerId.equals(currentUserId);

        if (!isProvider) {
            throw new AccessDeniedException("Chỉ chủ xe mới có quyền hủy đơn do khách không đến nhận.");
        }

        if (booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new IllegalStateException("Chỉ được hủy đơn chưa nhận xe.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = booking.getTimeBookingStart();

        if (now.isBefore(startDate)) {
            throw new IllegalStateException("Chưa đến thời gian nhận xe. Không thể dùng chức năng này.");
        }

        BigDecimal penalty = calculatePenalty(booking);
        booking.setPenaltyValue(penalty);

        BigDecimal refundAmount = booking.getTotalCost().subtract(penalty);
        if (refundAmount.compareTo(BigDecimal.ZERO) < 0) refundAmount = BigDecimal.ZERO;

        // Hoàn tiền (nếu có)
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            Wallet renterWallet = walletRepository.findByUserId(booking.getUser().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ví người thuê."));
            renterWallet.setBalance(renterWallet.getBalance().add(refundAmount));
            walletRepository.save(renterWallet);

            WalletTransaction refundTx = WalletTransaction.builder()
                    .wallet(renterWallet)
                    .amount(refundAmount)
                    .status(WalletTransaction.Status.APPROVED)
                    .build();
            walletTransactionRepository.save(refundTx);
        }

        // Chuyển tiền phạt cho chủ xe
        if (penalty.compareTo(BigDecimal.ZERO) > 0) {
            Wallet providerWallet = walletRepository.findByUserId(providerId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ví chủ xe."));
            providerWallet.setBalance(providerWallet.getBalance().add(penalty));
            walletRepository.save(providerWallet);

            WalletTransaction penaltyTx = WalletTransaction.builder()
                    .wallet(providerWallet)
                    .amount(penalty)
                    .status(WalletTransaction.Status.APPROVED)
                    .build();
            walletTransactionRepository.save(penaltyTx);
        }

        // Cập nhật trạng thái booking
        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);

        // Xoá BookedTimeSlot
        for (BookingDetail detail : booking.getBookingDetails()) {
            bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                    detail.getVehicle().getId(),
                    booking.getTimeBookingStart(),
                    booking.getTimeBookingEnd()
            );
        }

        // Hủy hợp đồng (nếu có)
        List<Contract> contracts = contractRepository.findByBookingId(bookingId);
        String finalContractId = null;

        if (!contracts.isEmpty()) {
            Contract contract = contracts.get(0);
            contract.setStatus(Contract.Status.CANCELLED);
            contractRepository.save(contract);

            CreateFinalContractDTO finalContractDTO = CreateFinalContractDTO.builder()
                    .contractId(contract.getId())
                    .userId(currentUserId)
                    .timeFinish(LocalDateTime.now())
                    .costSettlement(refundAmount)
                    .note("Hủy do khách không đến nhận xe. " + (reason != null ? "Lý do: " + reason : ""))
                    .build();

            try {
                var finalContract = finalContractService.createFinalContract(finalContractDTO);
                finalContractId = finalContract.getId();
            } catch (Exception e) {
                log.error("Không thể tạo hợp đồng hủy đơn do khách không đến: {}", e.getMessage());
            }
        }

        // Gửi thông báo
        notificationService.notifyOrderCanceled(booking.getUser().getId(), bookingId,
                "Đơn đã bị hủy do bạn không đến nhận xe đúng giờ.");
        notificationService.notifyOrderCanceled(providerId, bookingId,
                "Bạn đã hủy đơn vì khách không đến nhận xe." + (reason != null ? " Lý do: " + reason : ""));

        return CancelBookingResponseDTO.builder()
                .bookingId(bookingId)
                .status(booking.getStatus().toString())
                .contractStatus("CANCELLED")
                .finalContractId(finalContractId)
                .refundAmount(refundAmount)
                .penaltyAmount(penalty)
                .reason(reason)
                .message("Đã hủy đơn do khách không đến nhận xe.")
                .build();
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

   // public String extractUserIdFromToken(String token) {
      //  try {
      //      return SignedJWT.parse(token).getJWTClaimsSet().getStringClaim("userId");
     //   } catch (ParseException e) {
     //       throw new RuntimeException("Không thể lấy userId từ token", e);
    //    }
  //  }

    @Override
    @Transactional
    public void payBookingWithWallet(String bookingId, String token) {
        String userId = jwtUtil.extractUserIdFromToken(token);
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
//        booking.setStatus(Booking.Status.PENDING);
        booking.setStatus(Booking.Status.CONFIRMED);
        bookingRepository.save(booking);
        notificationService.notifyPaymentCompleted(userId, booking.getId(), totalCost.doubleValue());


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
