package com.rft.rft_be.service;

import com.nimbusds.jwt.SignedJWT;
import com.rft.rft_be.dto.booking.*;
import com.rft.rft_be.dto.finalcontract.FinalContractDTO;
import com.rft.rft_be.service.Contract.FinalContractService;
import com.rft.rft_be.cleanUp.BookingCleanupTask;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.BookingMapper;
import com.rft.rft_be.mapper.BookingResponseMapper;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.Notification.NotificationService;
import com.rft.rft_be.service.booking.BookingServiceImpl;
import com.rft.rft_be.util.JwtUtil;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import java.math.BigDecimal;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static java.util.Collections.emptyList;
import static org.mockito.Mockito.*;


public class BookingServiceTest {

    @InjectMocks
    private BookingServiceImpl bookingService;

    @Mock private BookingRepository bookingRepository;
    @Mock private UserRepository userRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private BookedTimeSlotRepository bookedTimeSlotRepository;
    @Mock private BookingResponseMapper bookingResponseMapper;
    @Mock private BookingCleanupTask bookingCleanupTask;
    @Mock private BookingDetailRepository bookingDetailRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private ContractRepository contractRepository;
    @Mock private NotificationService notificationService;
    @Mock private NotificationMapper notificationMapper;
    @Mock private VehicleMapper vehicleMapper;
    @Mock private BookingMapper bookingMapper;
    @Mock private JwtUtil jwtUtil;
    @Mock private FinalContractService finalContractService;

    private BookingRequestDTO request;
    private User renter;
    private Vehicle vehicle1;
    private Vehicle vehicle2;
    private User provider;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        renter = User.builder()
                .id("user_001")
                .build();

        provider = User.builder()
                .id("provider_001")
                .openTime(LocalDateTime.of(2025, 8, 10, 8, 0))
                .closeTime(LocalDateTime.of(2025, 8, 10, 17, 0))
                .build();

        vehicle1 = Vehicle.builder()
                .id("vehicle_001")
                .costPerDay(BigDecimal.valueOf(300000))
                .user(provider)
                .build();

        vehicle2 = Vehicle.builder()
                .id("vehicle_002")
                .costPerDay(BigDecimal.valueOf(400000))
                .user(provider)
                .build();

        request = BookingRequestDTO.builder()
                .vehicleIds(List.of("vehicle_001", "vehicle_002"))
                .timeBookingStart(LocalDateTime.of(2025, 8, 10, 10, 0))
                .timeBookingEnd(LocalDateTime.of(2025, 8, 12, 10, 0))
                .phoneNumber("0987654321")
                .address("123 Nguyen Van Cu")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(24)
                .pickupMethod("pickup")
                .build();
    }


    @Test
    void createBooking_success_withMultipleVehicles() {
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(List.of("vehicle_001", "vehicle_002")))
                .thenReturn(List.of(vehicle1, vehicle2));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(emptyList());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any()))
                .thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        BookingResponseDTO response = bookingService.createBooking(request, "user_001");

        Assertions.assertThat(response).isNotNull();
        verify(bookingRepository).save(any());
    }

    @Test
    void createBooking_userBookingOwnVehicle_shouldFail() {
        vehicle1.setUser(renter);
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void createBooking_vehicleIdsContainDifferentProviders_shouldFail() {
        vehicle2.setUser(User.builder().id("provider_999").build());
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1, vehicle2));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Tất cả xe trong một đơn phải thuộc cùng một chủ xe");
    }

    @Test
    void createBooking_vehicleAlreadyBooked_shouldFail() {
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1, vehicle2));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(List.of(new BookedTimeSlot())); // simulate conflict

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("đã được đặt trong khoảng thời gian này");
    }

    @Test
    void createBooking_userHasExistingBooking_shouldFail() {
        request.setVehicleIds(List.of("vehicle_001")); // ✅ bảo đảm trùng với mock
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(List.of("vehicle_001"))).thenReturn(List.of(vehicle1)); // ✅ đủ xe

        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(List.of()); // không trùng slot
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(
                any(), any(), any(), any(), any())
        ).thenReturn(true); // ✅ mô phỏng trùng booking

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Bạn đã đặt xe");
    }

    @Test
    void createBooking_invalidTime_shouldFail() {
        request.setTimeBookingEnd(LocalDateTime.of(2025, 8, 9, 10, 0)); // trước thời gian bắt đầu
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    @Test
    void createBooking_userNotFound_shouldFail() {
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Không tìm thấy người dùng");
    }

    @Test
    void createBooking_someVehicleNotFound_shouldFail() {
        when(userRepository.findById(any())).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1)); // thiếu 1 vehicle

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Một hoặc nhiều xe không tồn tại");
    }

    @Test
    void createBooking_invalidMinutes_shouldFail() {
        request.setTimeBookingStart(LocalDateTime.of(2025, 8, 10, 10, 15)); // phút không hợp lệ
        request.setTimeBookingEnd(LocalDateTime.of(2025, 8, 12, 10, 45));

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1, vehicle2)); // ✅ Đủ 2 xe

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thời gian chỉ được chọn theo bước 30 phút");
    }

    @Test
    void createBooking_outsideOperatingHours_shouldFail() {
        request.setTimeBookingStart(LocalDateTime.of(2025, 8, 10, 6, 0)); // trước giờ mở
        request.setTimeBookingEnd(LocalDateTime.of(2025, 8, 12, 18, 0)); // sau giờ đóng

        provider.setOpenTime(LocalDateTime.of(2025, 8, 10, 8, 0));
        provider.setCloseTime(LocalDateTime.of(2025, 8, 10, 17, 0));
        vehicle1.setUser(provider);

        request.setVehicleIds(List.of("vehicle_001"));
        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(List.of("vehicle_001"))).thenReturn(List.of(vehicle1));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Giờ bắt đầu phải trong khoảng 08:00 đến 17:00");
    }


    @Test
    void createBooking_validCoupon_success() {
        request.setCouponId("SALE10");
        request.setVehicleIds(List.of("vehicle_001"));

        Coupon coupon = Coupon.builder()
                .id("SALE10")
                .discount(BigDecimal.valueOf(10))
                .status(Coupon.CouponStatus.VALID)
                .timeExpired(LocalDateTime.now().plusDays(1))
                .build();

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(List.of("vehicle_001"))).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(couponRepository.findById("SALE10")).thenReturn(Optional.of(coupon));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        BookingResponseDTO response = bookingService.createBooking(request, "user_001");

        Assertions.assertThat(response).isNotNull();
        verify(couponRepository, times(1)).findById("SALE10");
    }

    @Test
    void createBooking_walletNotEnough_triggerExternalPayment() {
        Wallet wallet = Wallet.builder()
                .user(renter)
                .balance(BigDecimal.valueOf(100_000)) // Ví ít tiền
                .build();

        request.setVehicleIds(List.of("vehicle_001")); // vehicle này giá 300_000 / day

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(walletRepository.findByUserId("user_001")).thenReturn(Optional.of(wallet)); // <- vẫn có, nhưng không verify
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        BookingResponseDTO response = bookingService.createBooking(request, "user_001");

        Assertions.assertThat(response).isNotNull();
    }
    @Test
    void createBooking_extraFeeCalculationFails_shouldThrow() {
        request.setVehicleIds(List.of("vehicle_001"));

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);

        // ✅ Bắt buộc mock phần mapping DTO để tránh NullPointerException
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(bookingDetailRepository.saveAll(any())).thenReturn(List.of());
        when(bookedTimeSlotRepository.save(any())).thenReturn(null);
        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        // ✅ Giả lập lỗi tính phí phát sinh
        doThrow(new IllegalStateException("Phí phát sinh lỗi"))
                .when(bookingCleanupTask).scheduleCleanup(any());

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                )
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Phí phát sinh lỗi");
    }

    @Test
    void createBooking_saveContractAndNotify_success() {
        request.setVehicleIds(List.of("vehicle_001"));

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(contractRepository.save(any())).thenReturn(mock(Contract.class));

        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        BookingResponseDTO response = bookingService.createBooking(request, "user_001");

        Assertions.assertThat(response).isNotNull();
    }

    @Test
    void createBooking_bookingDetailSaveFails_shouldThrow() {
        request.setVehicleIds(List.of("vehicle_001"));

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Giả lập lỗi khi lưu chi tiết booking
        doThrow(new RuntimeException("Lỗi khi lưu chi tiết"))
                .when(bookingDetailRepository).saveAll(any());

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Lỗi khi lưu chi tiết");
    }

    @Test
    void createBooking_invalidCoupon_shouldThrow() {
        request.setCouponId("INVALID_CODE");
        request.setVehicleIds(List.of("vehicle_001"));

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(couponRepository.findById("INVALID_CODE")).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                ).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Mã giảm giá không tồn tại");
    }

    @Test
    void createBooking_couponExpired_shouldThrow() {
        request.setCouponId("EXPIRED_CODE");
        request.setVehicleIds(List.of("vehicle_001"));

        // ✅ Setup coupon đã hết hạn
        Coupon expiredCoupon = Coupon.builder()
                .id("EXPIRED_CODE")
                .discount(BigDecimal.valueOf(10))
                .status(Coupon.CouponStatus.VALID)
                .timeExpired(LocalDateTime.now().minusDays(1)) // ❗ ĐÃ HẾT HẠN
                .build();

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(couponRepository.findById("EXPIRED_CODE")).thenReturn(Optional.of(expiredCoupon));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                )
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Mã giảm giá đã hết hạn");
    }

    @Test
    void createBooking_couponInvalidStatus_shouldThrow() {
        request.setCouponId("USED_CODE");
        request.setVehicleIds(List.of("vehicle_001"));

        // ✅ Setup coupon trạng thái không hợp lệ
        Coupon invalidCoupon = Coupon.builder()
                .id("USED_CODE")
                .discount(BigDecimal.valueOf(15))
                .status(Coupon.CouponStatus.EXPIRED)
                .timeExpired(LocalDateTime.now().plusDays(1))
                .build();

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        // ✅ mock đúng method đang dùng: findById hoặc findByCode
        when(couponRepository.findById("USED_CODE")).thenReturn(Optional.of(invalidCoupon));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_001")
                )
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Mã giảm giá đã hết hạn");
    }

    @Test
    void createBooking_totalAfterDiscountNegative_shouldClampToZero() {
        request.setCouponId("BIG_DISCOUNT");
        request.setVehicleIds(List.of("vehicle_001"));

        Coupon coupon = Coupon.builder()
                .id("SALE10")
                .discount(BigDecimal.valueOf(10))
                .status(Coupon.CouponStatus.VALID)
                .timeExpired(LocalDateTime.now().plusDays(1)) // ✅ dùng đúng field
                .build();

        when(userRepository.findById("user_001")).thenReturn(Optional.of(renter));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle1));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.existsBookingForUserAndVehicleAndTimeRange(any(), any(), any(), any(), any())).thenReturn(false);
        when(couponRepository.findById("BIG_DISCOUNT")).thenReturn(Optional.of(coupon));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        BookingResponseDTO response = bookingService.createBooking(request, "user_001");

        Assertions.assertThat(response).isNotNull();
        verify(couponRepository).findById("BIG_DISCOUNT");
    }

    @Test
    void getAllBookings_shouldReturnListOfBookingResponseDTO() {
        Booking booking = Booking.builder().id("B001").build();
        BookingResponseDTO dto = new BookingResponseDTO();

        when(bookingRepository.findAllWithUserAndVehicle()).thenReturn(List.of(booking));
        when(vehicleMapper.mapToBookingResponseDTO(booking)).thenReturn(dto);

        List<BookingResponseDTO> result = bookingService.getAllBookings();

        Assertions.assertThat(result).hasSize(1);
        verify(bookingRepository).findAllWithUserAndVehicle();
        verify(vehicleMapper).mapToBookingResponseDTO(booking);
    }

    @Test
    void getBookingById_existingId_shouldReturnDTO() {
        Booking booking = Booking.builder().id("B001").build();
        BookingResponseDTO dto = new BookingResponseDTO();

        when(bookingRepository.findByIdWithUserAndVehicle("B001")).thenReturn(Optional.of(booking));
        when(vehicleMapper.mapToBookingResponseDTO(booking)).thenReturn(dto);

        BookingResponseDTO result = bookingService.getBookingById("B001");

        Assertions.assertThat(result).isEqualTo(dto);
        verify(bookingRepository).findByIdWithUserAndVehicle("B001");
    }

    @Test
    void getBookingById_notFound_shouldThrow() {
        when(bookingRepository.findByIdWithUserAndVehicle("B999")).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> bookingService.getBookingById("B999"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Không tìm thấy Booking với ID");

        verify(bookingRepository).findByIdWithUserAndVehicle("B999");
    }

    @Test
    void getBookingsByStatus_validStatus_shouldReturnList() {
        Booking booking = Booking.builder().status(Booking.Status.PENDING).build();
        BookingDTO dto = new BookingDTO();

        when(bookingRepository.findByStatus(Booking.Status.PENDING)).thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(dto);

        List<BookingDTO> result = bookingService.getBookingsByStatus("PENDING");

        Assertions.assertThat(result).hasSize(1);
        verify(bookingRepository).findByStatus(Booking.Status.PENDING);
    }

    @Test
    void getBookingsByStatus_invalidStatus_shouldThrowRuntimeException() {
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByStatus("UNKNOWN"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status");

        verifyNoInteractions(bookingRepository);
    }

    @Test
    void getBookingsByUserIdAndDateRange_shouldReturnList() {
        String userId = "user_001";
        LocalDateTime start = LocalDateTime.of(2025, 8, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 8, 31, 23, 59);

        Booking booking = Booking.builder().id("B002").build();
        BookingDTO dto = new BookingDTO();

        when(bookingRepository.findByUserIdAndTimeBookingStartBetween(userId, start, end)).thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(dto);

        List<BookingDTO> result = bookingService.getBookingsByUserIdAndDateRange(userId, start, end);

        Assertions.assertThat(result).hasSize(1);
        verify(bookingRepository).findByUserIdAndTimeBookingStartBetween(userId, start, end);
    }

    @Test
    void getBookingsByUserIdAndDateRange_repoThrows_shouldWrapInRuntimeException() {
        String userId = "user_001";
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().plusDays(7);

        when(bookingRepository.findByUserIdAndTimeBookingStartBetween(any(), any(), any()))
                .thenThrow(new RuntimeException("Database down"));

        Assertions.assertThatThrownBy(() ->
                        bookingService.getBookingsByUserIdAndDateRange(userId, start, end)
                )
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to get bookings by date range");
    }

    @Test
    void getBookingsByUserId_userExists_shouldReturnList() {
        when(userRepository.existsById("user_001")).thenReturn(true);

        Booking booking = Booking.builder().id("B01").build();
        BookingDTO dto = new BookingDTO();
        when(bookingRepository.findByUserId("user_001")).thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(dto);

        List<BookingDTO> result = bookingService.getBookingsByUserId("user_001");

        Assertions.assertThat(result).hasSize(1);
        verify(userRepository).existsById("user_001");
        verify(bookingRepository).findByUserId("user_001");
    }

    @Test
    void getBookingsByUserId_userNotExist_shouldThrow() {
        when(userRepository.existsById("user_001")).thenReturn(false);

        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByUserId("user_001"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found with id");

        verify(userRepository).existsById("user_001");
        verifyNoInteractions(bookingRepository);
    }

    @Test
    void getBookingsByUserIdAndStatus_validInput_shouldReturnList() {
        when(userRepository.existsById("user_001")).thenReturn(true);
        Booking booking = Booking.builder().status(Booking.Status.PENDING).build();
        when(bookingRepository.findByUserIdAndStatus("user_001", Booking.Status.PENDING)).thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(new BookingDTO());

        List<BookingDTO> result = bookingService.getBookingsByUserIdAndStatus("user_001", "PENDING");

        Assertions.assertThat(result).hasSize(1);
        verify(bookingRepository).findByUserIdAndStatus("user_001", Booking.Status.PENDING);
    }

    @Test
    void getBookingsByUserIdAndStatus_invalidStatus_shouldThrow() {
        when(userRepository.existsById("user_001")).thenReturn(true);

        Assertions.assertThatThrownBy(() ->
                        bookingService.getBookingsByUserIdAndStatus("user_001", "UNKNOWN")
                )
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status");

        verify(userRepository).existsById("user_001");
        verifyNoInteractions(bookingRepository);
    }

    @Test
    void getBookingsByProviderId_shouldReturnList() {
        Booking booking = Booking.builder().id("B01").build();
        when(bookingRepository.findByProviderId("provider_001")).thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(new BookingDTO());

        List<BookingDTO> result = bookingService.getBookingsByProviderId("provider_001");

        Assertions.assertThat(result).hasSize(1);
        verify(bookingRepository).findByProviderId("provider_001");
    }

    @Test
    void getBookingsByProviderIdAndStatus_validInput_shouldReturnList() {
        Booking booking = Booking.builder().status(Booking.Status.CONFIRMED).build();
        when(bookingRepository.findByProviderIdAndStatus("provider_001", Booking.Status.CONFIRMED))
                .thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(new BookingDTO());

        List<BookingDTO> result = bookingService.getBookingsByProviderIdAndStatus("provider_001", "CONFIRMED");

        Assertions.assertThat(result).hasSize(1);
        verify(bookingRepository).findByProviderIdAndStatus("provider_001", Booking.Status.CONFIRMED);
    }

    @Test
    void getBookingsByProviderIdAndStatus_invalidStatus_shouldThrow() {
        Assertions.assertThatThrownBy(() ->
                        bookingService.getBookingsByProviderIdAndStatus("provider_001", "INVALID_STATUS")
                )
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid booking status");
    }



    private void mockExtractUserId(String userId) {
        when(jwtUtil.extractUserIdFromToken("token")).thenReturn(userId);
    }

    private Booking mockPendingBookingWithProvider(String providerId) {
        User provider = new User();
        provider.setId(providerId);

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(provider);
        vehicle.setThumb("Xe ABC");

        BookingDetail detail = new BookingDetail();
        detail.setVehicle(vehicle);

        List<BookingDetail> details = List.of(detail);

        User renter = new User();
        renter.setId("renter123");

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.PENDING)
                .bookingDetails(details)
                .user(renter)
                .address("Số 1 Đường A")
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Booking mockBookingWithConfirmedStatus(String providerId, LocalDateTime timeStart) {
        User provider = new User();
        provider.setId(providerId);

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(provider);
        vehicle.setId("vehicle123");
        vehicle.setThumb("Xe ABC");

        BookingDetail detail = new BookingDetail();
        detail.setVehicle(vehicle);

        List<BookingDetail> details = new ArrayList<>();
        details.add(detail);

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.CONFIRMED)
                .timeBookingStart(timeStart)
                .address("ABC Street")
                .bookingDetails(details)
                .user(new User())
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Booking mockBookingWithStatus(String userId, Booking.Status status) {
        User user = new User();
        user.setId(userId);

        Booking booking = Booking.builder()
                .id("booking123")
                .status(status)
                .user(user)
                .bookingDetails(new ArrayList<>())
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Booking mockConfirmedBookingWithStartTime(int hoursBeforeStart, String providerId) {
        LocalDateTime startTime = LocalDateTime.now().plusHours(hoursBeforeStart);

        User provider = new User();
        provider.setId(providerId);

        User renter = new User();
        renter.setId("renter123");

        Vehicle vehicle = new Vehicle();
        vehicle.setId("vehicle123");
        vehicle.setThumb("Xe ABC");
        vehicle.setUser(provider); // Gán provider cho vehicle

        BookingDetail detail = new BookingDetail();
        detail.setVehicle(vehicle);

        List<BookingDetail> details = List.of(detail);

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.CONFIRMED)
                .timeBookingStart(startTime)
                .bookingDetails(details)
                .user(renter)
                .address("Số 1, Đường ABC")
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Booking mockDeliveredBooking(String renterId) {
        User renter = new User();
        renter.setId(renterId);

        User provider = new User();
        provider.setId("provider123");

        Vehicle vehicle = new Vehicle();
        vehicle.setThumb("Xe ABC");
        vehicle.setUser(provider); // ✅ Gán provider cho vehicle

        BookingDetail detail = new BookingDetail();
        detail.setVehicle(vehicle);

        List<BookingDetail> details = List.of(detail);

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.DELIVERED)
                .user(renter)
                .bookingDetails(details)
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Booking mockReceivedBooking(String renterId) {
        User renter = new User();
        renter.setId(renterId);

        User provider = new User();
        provider.setId("provider123");

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(provider); // gán provider cho vehicle
        vehicle.setThumb("Xe ABC");

        BookingDetail detail = new BookingDetail();
        detail.setVehicle(vehicle);

        List<BookingDetail> details = List.of(detail);

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.RECEIVED_BY_CUSTOMER)
                .user(renter)
                .bookingDetails(details) // ✅ Bắt buộc
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Booking mockReturnedBooking(String providerId) {
        User provider = new User();
        provider.setId(providerId);

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(provider);
        vehicle.setThumb("Xe ABC");

        BookingDetail detail = new BookingDetail();
        detail.setVehicle(vehicle);

        List<BookingDetail> details = List.of(detail);

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.RETURNED)
                .user(new User())
                .bookingDetails(details)
                .address("123 Main St")
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        return booking;
    }

    private Contract mockContract() {
        Contract contract = new Contract();
        contract.setId("contract123");
        contract.setStatus(Contract.Status.PROCESSING);
        return contract;
    }

    @Test
    void confirmBooking_success() {
        mockExtractUserId("provider123");
        Booking booking = mockPendingBookingWithProvider("provider123");
        when(bookingRepository.save(any())).thenReturn(booking);

        bookingService.confirmBooking("booking123", "token");

        assertEquals(Booking.Status.CONFIRMED, booking.getStatus());
        verify(notificationService).notifyOrderApproved(any(), eq("booking123"));
        verify(contractRepository).save(any(Contract.class));
    }

    @Test
    void confirmBooking_wrongUser_throwAccessDenied() {
        mockExtractUserId("wrongUser");
        Booking booking = mockPendingBookingWithProvider("provider123");

        assertThrows(AccessDeniedException.class, () ->
                bookingService.confirmBooking("booking123", "token"));
    }

    @Test
    void confirmBooking_wrongStatus_throwIllegalState() {
        mockExtractUserId("provider123");
        Booking booking = mockBookingWithStatus("provider123", Booking.Status.CONFIRMED);

        assertThrows(IllegalStateException.class, () ->
                bookingService.confirmBooking("booking123", "token"));
    }

    @Test
    void deliverVehicle_success() {
        mockExtractUserId("provider123");
        Booking booking = mockConfirmedBookingWithStartTime(6, "provider123");

        when(bookingRepository.save(any())).thenReturn(booking);
        bookingService.deliverVehicle("booking123", "token");
        assertEquals(Booking.Status.DELIVERED, booking.getStatus());
        verify(notificationService).notifyVehicleHandover(any(), any(), any(), any());
    }

    @Test
    void deliverVehicle_tooEarly_throwException() {
        mockExtractUserId("provider123");
        Booking booking = mockConfirmedBookingWithStartTime(10, "provider123"); // Quá sớm

        assertThrows(ResponseStatusException.class, () ->
                bookingService.deliverVehicle("booking123", "token"));
    }

    @Test
    void receiveVehicle_success() {
        mockExtractUserId("renter123");
        Booking booking = mockDeliveredBooking("renter123");

        when(contractRepository.findByBookingId("booking123")).thenReturn(List.of(mockContract()));

        bookingService.receiveVehicle("booking123", "token");

        assertEquals(Booking.Status.RECEIVED_BY_CUSTOMER, booking.getStatus());
        verify(contractRepository).save(argThat(c -> c.getStatus() == Contract.Status.RENTING));
        verify(notificationService).notifyVehiclePickupConfirmed(any(), any(), any());
    }

    @Test
    void returnVehicle_success() {
        mockExtractUserId("renter123");
        Booking booking = mockReceivedBooking("renter123");

        bookingService.returnVehicle("booking123", "token");

        assertEquals(Booking.Status.RETURNED, booking.getStatus());
        verify(notificationService).notifyVehicleReturnConfirmed(any(), any());
    }

    @Test
    void returnVehicle_wrongUser_shouldThrowAccessDenied() {
        Booking booking = mockReceivedBooking("renter123");
        when(jwtUtil.extractUserIdFromToken("token")).thenReturn("otherUser");
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        assertThrows(AccessDeniedException.class, () ->
                bookingService.returnVehicle("booking123", "token")
        );
    }

    @Test
    void returnVehicle_invalidStatus_shouldThrowIllegalState() {
        Booking booking = mockReceivedBooking("renter123");
        booking.setStatus(Booking.Status.PENDING);
        when(jwtUtil.extractUserIdFromToken("token")).thenReturn("renter123");
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        assertThrows(IllegalStateException.class, () ->
                bookingService.returnVehicle("booking123", "token")
        );
    }

    @Test
    void completeBooking_success() {
        mockExtractUserId("provider123");
        Booking booking = mockReturnedBooking("provider123");
        Contract contract = mockContract();

        when(contractRepository.findByBookingId("booking123")).thenReturn(List.of(contract));
        when(finalContractService.createFinalContract(any()))
                .thenReturn(FinalContractDTO.builder().id("final123").build());

        bookingService.completeBooking("booking123", "token", LocalDateTime.now(), BigDecimal.TEN, "note");

        assertEquals(Booking.Status.COMPLETED, booking.getStatus());
        assertEquals(Contract.Status.FINISHED, contract.getStatus());
        verify(finalContractService).createFinalContract(any());
        verify(notificationService).notifyBookingCompleted(any(), eq("booking123"));
    }

    @Test
    void cancelBooking_wrongUser_shouldThrowAccessDenied() {
        mockExtractUserId("wrongUserId");

        Booking booking = Booking.builder()
                .id("booking123")
                .user(User.builder().id("renter123").build())
                .bookingDetails(List.of(BookingDetail.builder()
                        .vehicle(Vehicle.builder()
                                .user(User.builder().id("provider123").build())
                                .build())
                        .build()))
                .status(Booking.Status.PENDING)
                .totalCost(BigDecimal.valueOf(100_000))
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        CancelBookingRequestDTO request = CancelBookingRequestDTO.builder()
                .createFinalContract(false)
                .reason("Không có quyền")
                .build();

        assertThrows(AccessDeniedException.class, () ->
                bookingService.cancelBooking("booking123", "token", request));
    }

    @Test
    void payBooking_success() {
        mockExtractUserId("renter123");

        User renter = new User();
        renter.setId("renter123");

        Booking booking = Booking.builder()
                .id("booking123")
                .user(renter)
                .status(Booking.Status.UNPAID)
                .totalCost(BigDecimal.valueOf(500))
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        Wallet wallet = Wallet.builder()
                .id("wallet123")
                .balance(BigDecimal.valueOf(1000))
                .build();

        when(walletRepository.findByUserId("renter123")).thenReturn(Optional.of(wallet));

        when(bookingRepository.save(any())).thenReturn(booking);
        when(walletRepository.save(any())).thenReturn(wallet);
        when(walletTransactionRepository.save(any())).thenReturn(null);
        when(contractRepository.save(any())).thenReturn(null);

        bookingService.payBookingWithWallet("booking123", "token");

        assertEquals(Booking.Status.PENDING, booking.getStatus());
        verify(notificationService).notifyPaymentCompleted("renter123", "booking123", 500.0);
    }

    @Test
    void payBooking_wrongUser_shouldThrowAccessDenied() {
        mockExtractUserId("wrongUser");

        User renter = new User();
        renter.setId("renter123");

        Booking booking = Booking.builder()
                .id("booking123")
                .user(renter)
                .status(Booking.Status.UNPAID)
                .totalCost(BigDecimal.valueOf(500))
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        assertThrows(AccessDeniedException.class, () ->
                bookingService.payBookingWithWallet("booking123", "token"));
    }

    @Test
    void payBooking_insufficientBalance_shouldThrowException() {
        mockExtractUserId("renter123");

        Booking booking = Booking.builder()
                .id("booking123")
                .status(Booking.Status.UNPAID)
                .user(User.builder().id("renter123").build())
                .totalCost(BigDecimal.valueOf(100_000))
                .build();

        Wallet wallet = Wallet.builder()
                .user(booking.getUser())
                .balance(BigDecimal.valueOf(50_000)) // Not enough
                .build();

        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        when(walletRepository.findByUserId("renter123")).thenReturn(Optional.of(wallet));

        assertThrows(IllegalStateException.class, () ->
                bookingService.payBookingWithWallet("booking123", "token"));
    }

    private Booking mockCancelableBooking(String renterId, String providerId, int hoursSincePayment, boolean tooLate) {
        User renter = new User(); renter.setId(renterId);
        User provider = new User(); provider.setId(providerId);
        Vehicle vehicle = new Vehicle(); vehicle.setUser(provider);
        BookingDetail detail = new BookingDetail(); detail.setVehicle(vehicle);

        return Booking.builder()
                .id("booking123")
                .user(renter)
                .status(Booking.Status.CONFIRMED)
                .bookingDetails(List.of(detail))
                .totalCost(BigDecimal.valueOf(100_000))
                .penaltyType(Booking.PenaltyType.PERCENT)
                .penaltyValue(BigDecimal.valueOf(10))
                .timeTransaction(LocalDateTime.now().minusHours(hoursSincePayment))
                .minCancelHour(2)
                .timeBookingStart(LocalDateTime.now().plusDays(1))
                .timeBookingEnd(LocalDateTime.now().plusDays(2))
                .build();
    }

    private Booking mockUnpaidBooking(String renterId) {
        User renter = new User(); renter.setId(renterId);
        return Booking.builder()
                .id("booking123")
                .user(renter)
                .status(Booking.Status.UNPAID)
                .totalCost(BigDecimal.valueOf(100_000))
                .build();
    }

    private Wallet mockWallet() {
        return mockWallet(BigDecimal.valueOf(500_000));
    }

    private Wallet mockWallet(BigDecimal balance) {
        Wallet wallet = new Wallet();
        wallet.setBalance(balance);
        return wallet;
    }
    @Test
    void isTimeSlotAvailable_noOverlap_shouldReturnTrue() {
        String vehicleId = "vehicle123";
        LocalDateTime start = LocalDateTime.of(2025, 8, 1, 10, 0);
        LocalDateTime end = LocalDateTime.of(2025, 8, 1, 12, 0);

        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(vehicleId, start, end))
                .thenReturn(Collections.emptyList());

        boolean result = bookingService.isTimeSlotAvailable(vehicleId, start, end);

        assertTrue(result);
    }

    @Test
    void isTimeSlotAvailable_withOverlap_shouldReturnFalse() {
        String vehicleId = "vehicle123";
        LocalDateTime start = LocalDateTime.of(2025, 8, 1, 10, 0);
        LocalDateTime end = LocalDateTime.of(2025, 8, 1, 12, 0);

        List<BookedTimeSlot> overlaps = List.of(new BookedTimeSlot());
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(vehicleId, start, end))
                .thenReturn(overlaps);

        boolean result = bookingService.isTimeSlotAvailable(vehicleId, start, end);

        assertFalse(result);
    }

    @Test
    void calculatePenalty_fixedType_shouldReturnFixedAmount() {
        Booking booking = Booking.builder()
                .penaltyType(Booking.PenaltyType.FIXED)
                .penaltyValue(new BigDecimal("200000"))
                .build();

        BigDecimal result = invokeCalculatePenalty(booking);
        assertEquals(new BigDecimal("200000"), result);
    }

    @Test
    void calculatePenalty_fixedType_nullValue_shouldReturnZero() {
        Booking booking = Booking.builder()
                .penaltyType(Booking.PenaltyType.FIXED)
                .penaltyValue(null)
                .build();

        BigDecimal result = invokeCalculatePenalty(booking);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void calculatePenalty_percentType_shouldReturnPercentageOfTotalCost() {
        Booking booking = Booking.builder()
                .penaltyType(Booking.PenaltyType.PERCENT)
                .penaltyValue(new BigDecimal("10"))
                .totalCost(new BigDecimal("2000000"))
                .build();

        BigDecimal result = invokeCalculatePenalty(booking);
        assertEquals(new BigDecimal("200000"), result);
    }

    @Test
    void calculatePenalty_percentType_nullTotalCost_shouldReturnZero() {
        Booking booking = Booking.builder()
                .penaltyType(Booking.PenaltyType.PERCENT)
                .penaltyValue(new BigDecimal("15"))
                .totalCost(null)
                .build();

        BigDecimal result = invokeCalculatePenalty(booking);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void calculatePenalty_nullPenaltyType_shouldReturnZero() {
        Booking booking = Booking.builder()
                .penaltyType(null)
                .penaltyValue(null)
                .build();

        BigDecimal result = invokeCalculatePenalty(booking);
        assertEquals(BigDecimal.ZERO, result);
    }

    // Helper method to invoke protected/private calculatePenalty if needed
    private BigDecimal invokeCalculatePenalty(Booking booking) {
        return ReflectionTestUtils.invokeMethod(bookingService, "calculatePenalty", booking);
    }

    @Test
    void cancelBooking_byRenter_withinAllowedTime_shouldRefundWithoutPenalty() {
        Booking booking = mockCancelableBooking("renter123", "provider123", 1, false); // giờ huỷ < minCancelHour

        when(jwtUtil.extractUserIdFromToken("token")).thenReturn("renter123");
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        mockWalletFor("renter123");

        CancelBookingRequestDTO request = CancelBookingRequestDTO.builder()
                .createFinalContract(false)
                .reason("Lý do cá nhân")
                .build();

        CancelBookingResponseDTO response = bookingService.cancelBooking("booking123", "token", request);

        assertEquals(Booking.Status.CANCELLED.name(), response.getStatus());
        assertEquals(BigDecimal.ZERO, response.getPenaltyAmount());
        verify(walletTransactionRepository).save(any());
    }

    @Test
    void cancelBooking_byRenter_lateCancellation_shouldApplyPenalty() {
        mockExtractUserId("renter123"); // 👈 THÊM DÒNG NÀY

        Booking booking = mockCancelableBooking("renter123", "provider123", 10, true); // giờ huỷ > minCancelHour, có penalty
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        mockWalletFor("renter123");
        mockWalletFor("provider123");

        CancelBookingRequestDTO request = CancelBookingRequestDTO.builder()
                .createFinalContract(false)
                .reason("Bận việc")
                .build();

        CancelBookingResponseDTO response = bookingService.cancelBooking("booking123", "token", request);

        assertEquals(Booking.Status.CANCELLED.name(), response.getStatus());
        assertTrue(response.getPenaltyAmount().compareTo(BigDecimal.ZERO) > 0);
        verify(walletTransactionRepository, times(2)).save(any()); // refund + penalty
    }

    @Test
    void cancelBooking_byProvider_shouldSucceedWithoutPenalty() {
        mockExtractUserId("provider123");

        Booking booking = mockCancelableBooking("renter123", "provider123", 10, false);
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));
        mockWalletFor("renter123");

        CancelBookingRequestDTO request = CancelBookingRequestDTO.builder()
                .createFinalContract(false)
                .reason("Không giao xe kịp")
                .build();

        CancelBookingResponseDTO response = bookingService.cancelBooking("booking123", "token", request);

        assertEquals(Booking.Status.CANCELLED.name(), response.getStatus());
        assertEquals(BigDecimal.ZERO, response.getPenaltyAmount());

    }

    @Test
    void cancelBooking_whenAlreadyCompleted_shouldThrowException() {
        mockExtractUserId("renter123");

        Booking booking = mockCancelableBooking("renter123", "provider123", 1, false);
        booking.setStatus(Booking.Status.COMPLETED);
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        CancelBookingRequestDTO request = CancelBookingRequestDTO.builder()
                .createFinalContract(false)
                .build();

        assertThrows(IllegalStateException.class, () -> {
            bookingService.cancelBooking("booking123", "token", request);
        });
    }

    @Test
    void cancelBooking_noBookingDetails_shouldThrowException() {
        Booking booking = mockCancelableBooking("renter123", "provider123", 1, false);
        booking.setBookingDetails(new ArrayList<>());
        when(bookingRepository.findById("booking123")).thenReturn(Optional.of(booking));

        CancelBookingRequestDTO request = CancelBookingRequestDTO.builder()
                .createFinalContract(false)
                .build();

        assertThrows(IllegalStateException.class, () -> {
            bookingService.cancelBooking("booking123", "token", request);
        });
    }

    private void mockWalletFor(String userId) {
        Wallet wallet = Wallet.builder()
                .id("wallet-" + userId)
                .balance(BigDecimal.valueOf(1_000_000))
                .user(User.builder().id(userId).build())
                .build();
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
    }
}


