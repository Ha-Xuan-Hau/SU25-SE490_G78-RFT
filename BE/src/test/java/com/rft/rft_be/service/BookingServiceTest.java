package com.rft.rft_be.service;

import com.rft.rft_be.dto.booking.*;
import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.BookingMapper;
import com.rft.rft_be.mapper.BookingResponseMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.Contract.FinalContractService;
import com.rft.rft_be.service.booking.BookingServiceImpl;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.rft.rft_be.dto.contract.FinalContractDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class BookingServiceTest {

    @Spy
    @InjectMocks
    private BookingServiceImpl bookingService;
    @Mock
    private FinalContractService finalContractService;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository walletTransactionRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private BookedTimeSlotRepository bookedTimeSlotRepository;
    @Mock
    private BookingResponseMapper bookingResponseMapper;
    @Mock
    private BookingCleanupTask bookingCleanupTask;
    @Mock
    private VehicleMapper vehicleMapper;
    @Mock
    private BookingMapper bookingMapper;
    @Autowired
    private MockMvc mockMvc;
    private JwtAuthenticationToken mockJwtAuthenticationToken;


    private BookingRequestDTO request;
    private User user; // Đối tượng User cho người đặt xe (ID: user_003)
    private Vehicle vehicle; // Đối tượng Vehicle
    private User vehicleOwner; // Đối tượng User cho chủ xe (ID: user_001)

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        doReturn("u1").when(bookingService).extractUserIdFromToken(anyString());

        Jwt jwt = new Jwt(
                "mock.token.here",
                LocalDateTime.now().minusMinutes(5).toInstant(ZoneOffset.UTC),
                LocalDateTime.now().plusMinutes(30).toInstant(ZoneOffset.UTC),
                Map.of("alg", "none"),
                Map.of("userId", "user_001", "scope", "user")
        );
        mockJwtAuthenticationToken = new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("SCOPE_user")));


        request = BookingRequestDTO.builder()
                .vehicleId("vehicle_001")
                .timeBookingStart(LocalDateTime.of(2025, 9, 21, 10, 0)) // 10:00 AM
                .timeBookingEnd(LocalDateTime.of(2025, 9, 29, 17, 0))   // 5:00 PM (kết thúc trước 18:00)
                .phoneNumber("0987654321")
                .address("12 Vo Thi Sau")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(48)
                .pickupMethod("pickup")
                .build();

        // Khởi tạo đối tượng người đặt xe (ID: user_003)
        user = User.builder()
                .id("user_003")
                .build();

        vehicleOwner = User.builder()
                .id("user_001") // ID của chủ xe là user_001
                .openTime(LocalDateTime.of(2000, 1, 1, 8, 0))   // 8:00 AM, ngày có thể là bất kỳ
                .closeTime(LocalDateTime.of(2000, 1, 1, 18, 0)) // 6:00 PM, ngày có thể là bất kỳ
                .build();

        // Khởi tạo đối tượng xe (ID: vehicle_001)
        vehicle = Vehicle.builder()
                .id("vehicle_001")
                .costPerDay(BigDecimal.valueOf(500000))
                .user(vehicleOwner) // Gán chủ xe (user_001) đã được thiết lập giờ hoạt động
                .status(Vehicle.Status.AVAILABLE) // Xe phải có trạng thái AVAILABLE
                .fuelType(Vehicle.FuelType.valueOf(Vehicle.FuelType.GASOLINE.name())) // Đảm bảo kiểu FuelType khớp với Entity của bạn
                .build();


    }


    // Booking thành công
    @Test
    void createBooking_success() {
        // Người đặt xe là user_003
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user));
        // Xe vehicle_001, chủ xe user_001 (đã có giờ hoạt động)
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(java.util.Collections.emptyList());
        when(bookingRepository.existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(eq("user_003"), eq("vehicle_001"), any(), any(), any())).thenReturn(false);

        Booking mockSavedBooking = Booking.builder()
                .id("booking_test_id_123")
                .user(user) // người đặt user_003
                .vehicle(vehicle) // xe vehicle_001
                .timeBookingStart(request.getTimeBookingStart())
                .timeBookingEnd(request.getTimeBookingEnd())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .penaltyType(Booking.PenaltyType.valueOf(request.getPenaltyType()))
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(request.getMinCancelHour())
                .totalCost(BigDecimal.valueOf(8).multiply(vehicle.getCostPerDay()))
                .status(Booking.Status.PENDING)
                .build();

        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking bookingToSave = invocation.getArgument(0);
            bookingToSave.setId("booking_test_id_123"); // Gán ID đúng
            return bookingToSave;
        });

        BookingResponseDTO mockResponseDTO = new BookingResponseDTO();
        mockResponseDTO.setId("booking_test_id_123"); // Thiết lập ID cho DTO phản hồi
        when(bookingResponseMapper.toResponseDTO(any(Booking.class))).thenReturn(mockResponseDTO);

        doNothing().when(bookingCleanupTask).scheduleCleanup(eq("booking_test_id_123"));

        BookingResponseDTO response = bookingService.createBooking(request, "user_003"); // Người đặt xe là user_003

        Assertions.assertThat(response).isNotNull();
        Assertions.assertThat(response.getId()).isEqualTo("booking_test_id_123");

        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(bookingCleanupTask, times(1)).scheduleCleanup(eq("booking_test_id_123"));
    }

    // Người dùng đặt xe của chính mình (user_003 đặt xe của user_003)
    @Test
    void createBooking_userBookingOwnVehicle_fail() {

        User user_003_asOwner = User.builder()
                .id("user_003")
                .openTime(LocalDateTime.of(2000, 1, 1, 8, 0))   // Giờ hoạt động của user_003 khi là chủ xe
                .closeTime(LocalDateTime.of(2000, 1, 1, 18, 0))
                .build();

        // Gán user_003 này làm chủ sở hữu của vehicle_001 CHỈ TRONG TEST NÀY.
        vehicle.setUser(user_003_asOwner);

        // Mock userRepository để trả về user_003_asOwner khi tìm kiếm user_003.
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user_003_asOwner));
        // Mock vehicleRepository để trả về vehicle_001 (giờ thuộc sở hữu của user_003_asOwner).
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003") // Người đặt là user_003
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // Không tìm thấy xe (vehicle_001 không tồn tại)
    @Test
    void createBooking_vehicleNotFound_fail() {
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user)); // user_003 tồn tại
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.empty()); // nhưng vehicle_001 thì không

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    // Không tìm thấy người dùng (user_003 không tồn tại)
    @Test
    void createBooking_userNotFound_fail() {
        when(userRepository.findById("user_003")).thenReturn(Optional.empty()); // user_003 không tồn tại

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    // Thời gian bắt đầu sau thời gian kết thúc
    @Test
    void createBooking_invalidTimeRange_fail() {
        request.setTimeBookingEnd(LocalDateTime.of(2025, 9, 20, 10, 0)); // end < start
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // Xe đã bị đặt trước trong khoảng thời gian đó
    @Test
    void createBooking_vehicleAlreadyBooked_fail() {
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(List.of(new BookedTimeSlot())); // Có slot đã book

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    // Người dùng đã có booking trùng thời gian chưa hoàn thành
    @Test
    void createBooking_alreadyHasActiveBooking_fail() {
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(java.util.Collections.emptyList());
        // Giả lập rằng user_003 đã có booking active cho xe này
        when(bookingRepository.existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(eq("user_003"), eq("vehicle_001"), any(), any(), any()))
                .thenReturn(true);

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    // Thời gian bắt đầu là null
    @Test
    void createBooking_nullStartTime_fail() {
        request.setTimeBookingStart(null); // Thời gian bắt đầu là null
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // Số điện thoại sai định dạng
    @Test
    void createBooking_invalidPhoneFormat_fail() {
        request.setPhoneNumber("123abc"); // Số điện thoại không hợp lệ
        when(userRepository.findById("user_003")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                        bookingService.createBooking(request, "user_003")
                ).isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    void getAllBookings_success() {
        when(bookingRepository.findAllWithUserAndVehicle()).thenReturn(List.of(new Booking()));
        when(vehicleMapper.mapToBookingResponseDTO(any())).thenReturn(new BookingResponseDTO());
        Assertions.assertThat(bookingService.getAllBookings()).hasSize(1);
    }

    @Test
    void getBookingById_found() {
        Booking booking = Booking.builder().id("booking123").build();
        when(bookingRepository.findByIdWithUserAndVehicle("booking123")).thenReturn(Optional.of(booking));
        when(vehicleMapper.mapToBookingResponseDTO(booking)).thenReturn(new BookingResponseDTO());
        Assertions.assertThat(bookingService.getBookingById("booking123")).isNotNull();
    }

    @Test
    void getBookingById_notFound() {
        when(bookingRepository.findByIdWithUserAndVehicle("id")).thenReturn(Optional.empty());
        Assertions.assertThatThrownBy(() -> bookingService.getBookingById("id"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getBookingsByStatus_invalidStatus() {
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByStatus("INVALID"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getBookingsByUserId_userNotExist() {
        when(userRepository.existsById("uid")).thenReturn(false);
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByUserId("uid"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getBookingsByUserId_success() {
        when(userRepository.existsById("uid")).thenReturn(true);
        when(bookingRepository.findByUserId("uid")).thenReturn(List.of(new Booking()));
        when(bookingMapper.toDTO(any())).thenReturn(new BookingDTO());
        Assertions.assertThat(bookingService.getBookingsByUserId("uid")).hasSize(1);
    }

    @Test
    void getBookingsByUserIdAndStatus_invalidStatus() {
        when(userRepository.existsById("uid")).thenReturn(true);
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByUserIdAndStatus("uid", "WRONG"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getBookingsByProviderId_success() {
        when(bookingRepository.findByProviderId("pid")).thenReturn(List.of(new Booking()));
        when(bookingMapper.toDTO(any())).thenReturn(new BookingDTO());
        Assertions.assertThat(bookingService.getBookingsByProviderId("pid")).hasSize(1);
    }

    @Test
    void getBookingsByProviderIdAndStatus_invalidStatus() {
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByProviderIdAndStatus("pid", "???"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void confirmBooking_invalidStatus_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .vehicle(Vehicle.builder().user(User.builder().id("u1").build()).build())
                .status(Booking.Status.CONFIRMED)
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        Assertions.assertThatThrownBy(() -> bookingService.confirmBooking("b1", jwtWithUser("u1")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void returnVehicle_success() {
        Booking booking = Booking.builder()
                .id("b1")
                .user(User.builder().id("u1").build())
                .status(Booking.Status.RECEIVED_BY_CUSTOMER)
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        bookingService.returnVehicle("b1", jwtWithUser("u1"));
        Assertions.assertThat(booking.getStatus()).isEqualTo(Booking.Status.RETURNED);
    }

    @Test
    void completeBooking_success() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.RETURNED)
                .vehicle(Vehicle.builder().id("v1").build())
                .timeBookingStart(LocalDateTime.now().minusDays(2))
                .timeBookingEnd(LocalDateTime.now())
                .build();
        Contract contract = Contract.builder().id("c1").build();

        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId("b1")).thenReturn(List.of(contract));
        FinalContract finalContract = FinalContract.builder().id("f1").build();

        when(finalContractService.createFinalContract(any(CreateFinalContractDTO.class)))
                .thenReturn(FinalContractDTO.builder().id("f1").build());

        bookingService.completeBooking("b1", jwtWithUser("u1"), BigDecimal.TEN, "note");

        verify(contractRepository).save(any(Contract.class));
        Assertions.assertThat(booking.getStatus()).isEqualTo(Booking.Status.COMPLETED);
    }

    @Test
    void isTimeSlotAvailable_conflict() {
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(List.of(new BookedTimeSlot()));
        boolean available = bookingService.isTimeSlotAvailable("v1", LocalDateTime.now(), LocalDateTime.now().plusHours(2));
        Assertions.assertThat(available).isFalse();
    }

    @Test
    void payBookingWithWallet_success() {
        Booking booking = Booking.builder()
                .id("b1")
                .user(User.builder().id("u1").build())
                .status(Booking.Status.UNPAID)
                .totalCost(BigDecimal.valueOf(500))
                .build();

        Wallet wallet = Wallet.builder()
                .user(booking.getUser())
                .balance(BigDecimal.valueOf(1000))
                .build();

        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        when(walletRepository.findByUserId("u1")).thenReturn(Optional.of(wallet));
        doReturn("u1").when(bookingService).extractUserIdFromToken(anyString());

        bookingService.payBookingWithWallet("b1", jwtWithUser("u1"));

        Assertions.assertThat(booking.getStatus()).isEqualTo(Booking.Status.PENDING);
        Assertions.assertThat(wallet.getBalance()).isEqualTo(BigDecimal.valueOf(500));
        verify(walletTransactionRepository).save(any(WalletTransaction.class));
        verify(contractRepository).save(any(Contract.class));
    }


    private String jwtWithUser(String userId) {
        return "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiAi" + userId + "In0.fake.signature";
    }

    @Test
    void isTimeSlotAvailable_noConflict() {
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(List.of());
        boolean available = bookingService.isTimeSlotAvailable("v1", LocalDateTime.now(), LocalDateTime.now().plusHours(2));
        Assertions.assertThat(available).isTrue();
    }

    @Test
    void cancelBooking_invalidStatus_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.COMPLETED)
                .user(User.builder().id("u1").build())
                .vehicle(Vehicle.builder().user(User.builder().id("p1").build()).build())
                .build();

        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        CancelBookingRequestDTO cancelRequest = new CancelBookingRequestDTO();
        cancelRequest.setCreateFinalContract(false);
        cancelRequest.setReason("Đã xong");

        Assertions.assertThatThrownBy(() -> bookingService.cancelBooking("b1", jwtWithUser("u1"), cancelRequest))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Không thể hủy đơn đặt khi đã nhận, trả hoặc hoàn tất");
    }
    @Test
    void cancelBooking_byRenter_withPenalty_shouldSucceed() {
        Booking booking = Booking.builder()
                .id("b1")
                .user(User.builder().id("u1").build())
                .vehicle(Vehicle.builder().user(User.builder().id("provider").build()).build())
                .status(Booking.Status.CONFIRMED)
                .penaltyType(Booking.PenaltyType.FIXED)
                .penaltyValue(BigDecimal.valueOf(100))
                .minCancelHour(1)
                .totalCost(BigDecimal.valueOf(1000))
                .timeTransaction(LocalDateTime.now().minusHours(2))
                .timeBookingStart(LocalDateTime.now().plusDays(1))
                .timeBookingEnd(LocalDateTime.now().plusDays(2))
                .build();

        Contract contract = Contract.builder().id("c1").build();

        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId("b1")).thenReturn(List.of(contract));
        when(finalContractService.createFinalContract(any(CreateFinalContractDTO.class)))
                .thenReturn(FinalContractDTO.builder().id("f1").build());

        CancelBookingRequestDTO cancelRequest = new CancelBookingRequestDTO();
        cancelRequest.setCreateFinalContract(true);
        cancelRequest.setReason("Không cần thuê nữa");

        CancelBookingResponseDTO response = bookingService.cancelBooking("b1", jwtWithUser("u1"), cancelRequest);

        Assertions.assertThat(response.getStatus()).isEqualTo("CANCELLED");
        Assertions.assertThat(response.getPenaltyAmount()).isEqualTo(BigDecimal.valueOf(100));
        Assertions.assertThat(response.getRefundAmount()).isEqualTo(BigDecimal.valueOf(900));
    }
    @Test
    void getBookingsByStatus_invalidStatus_shouldThrow() {
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByStatus("INVALID"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status");
    }

    @Test
    void getBookingsByStatus_success() {
        Booking booking = new Booking();
        when(bookingRepository.findByStatus(Booking.Status.CONFIRMED)).thenReturn(List.of(booking));
        when(bookingMapper.toDTO(booking)).thenReturn(new BookingDTO());
        List<BookingDTO> result = bookingService.getBookingsByStatus("CONFIRMED");
        Assertions.assertThat(result).hasSize(1);
    }


    @Test
    void validateAndApplyCoupon_invalid_shouldThrow() {
        when(walletRepository.findByUserId("u1")).thenThrow(new RuntimeException("Không tìm thấy ví"));
        Assertions.assertThatThrownBy(() -> bookingService.payBookingWithWallet("any", jwtWithUser("u1")))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void validateOperatingHours_not24h_shouldThrowInvalidMinute() {
        Vehicle vehicle = Vehicle.builder()
                .user(User.builder()
                        .openTime(LocalDateTime.of(2023,1,1,7,0))
                        .closeTime(LocalDateTime.of(2023,1,1,20,0))
                        .build())
                .build();

        LocalDateTime invalidStart = LocalDateTime.of(2023, 1, 1, 9, 15);
        LocalDateTime invalidEnd = LocalDateTime.of(2023, 1, 1, 10, 45);

        Assertions.assertThatThrownBy(() -> bookingService.validateOperatingHours(invalidStart, invalidEnd, vehicle))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thời gian chỉ được chọn theo bước 30 phút");
    }

    @Test
    void validateOperatingHours_24h_shouldPass() {
        Vehicle vehicle = Vehicle.builder()
                .user(User.builder()
                        .openTime(LocalDateTime.of(2023,1,1,0,0))
                        .closeTime(LocalDateTime.of(2023,1,1,0,0))
                        .build())
                .build();

        LocalDateTime start = LocalDateTime.of(2023, 1, 1, 1, 0);
        LocalDateTime end = LocalDateTime.of(2023, 1, 1, 2, 0);

        bookingService.validateOperatingHours(start, end, vehicle);
    }

    @Test
    void getBookingsByUserIdAndStatus_invalidStatus_shouldThrow() {
        when(userRepository.existsById("u1")).thenReturn(true);
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByUserIdAndStatus("u1", "INVALID"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status");
    }

    @Test
    void getBookingsByUserIdAndDateRange_exception_shouldThrow() {
        when(bookingRepository.findByUserIdAndTimeBookingStartBetween(any(), any(), any()))
                .thenThrow(new RuntimeException("DB error"));
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByUserIdAndDateRange("u1", LocalDateTime.now(), LocalDateTime.now().plusDays(1)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to get bookings by date range");
    }

    @Test
    void validateOperatingHours_invalidTime_shouldThrow() {
        Vehicle vehicle = Vehicle.builder()
                .user(User.builder()
                        .openTime(LocalDateTime.of(2023,1,1,7,0))
                        .closeTime(LocalDateTime.of(2023,1,1,20,0))
                        .build())
                .build();

        LocalDateTime invalidStart = LocalDateTime.of(2023, 1, 1, 6, 0);
        LocalDateTime invalidEnd = LocalDateTime.of(2023, 1, 1, 8, 0);

        Assertions.assertThatThrownBy(() -> bookingService.validateOperatingHours(invalidStart, invalidEnd, vehicle))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Giờ bắt đầu phải trong khoảng");
    }

    @Test
    void validateAndApplyCoupon_expired_shouldThrow() {
        Coupon expiredCoupon = Coupon.builder()
                .id("cp1")
                .status(Coupon.CouponStatus.VALID)
                .timeExpired(LocalDateTime.now().minusDays(1))
                .build();
        when(couponRepository.findById("cp1")).thenReturn(Optional.of(expiredCoupon));
        Assertions.assertThatThrownBy(() -> bookingService.validateAndApplyCoupon("cp1", BigDecimal.valueOf(100000)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Mã giảm giá đã hết hạn");
    }

    @Test
    void getBookingsByUserIdAndStatus_userNotFound_shouldThrow() {
        when(userRepository.existsById("u1")).thenReturn(false);
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByUserIdAndStatus("u1", "PENDING"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }


    @Test
    void getBookingsByProviderIdAndStatus_invalidStatus_shouldThrow() {
        Assertions.assertThatThrownBy(() -> bookingService.getBookingsByProviderIdAndStatus("p1", "INVALID"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid booking status");
    }

    @Test
    void confirmBooking_notOwner_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .vehicle(Vehicle.builder().user(User.builder().id("owner").build()).build())
                .status(Booking.Status.PENDING)
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        Assertions.assertThatThrownBy(() -> bookingService.confirmBooking("b1", jwtWithUser("other")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Chỉ chủ xe mới được xác nhận đơn đặt xe này");
    }

    @Test
    void deliverVehicle_invalidTimeWindow_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.CONFIRMED)
                .timeBookingStart(LocalDateTime.now().plusHours(10)) // >8h
                .vehicle(Vehicle.builder().user(User.builder().id("owner").build()).build())
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        // mock đúng user
        doReturn("owner").when(bookingService).extractUserIdFromToken(anyString());

        Assertions.assertThatThrownBy(() -> bookingService.deliverVehicle("b1", "token"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("giao xe trong khoảng từ 5 đến 8 tiếng");
    }

    @Test
    void deliverVehicle_wrongOwner_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.CONFIRMED)
                .timeBookingStart(LocalDateTime.now().plusHours(6))
                .vehicle(Vehicle.builder().user(User.builder().id("correctOwner").build()).build())
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        Assertions.assertThatThrownBy(() -> bookingService.deliverVehicle("b1", jwtWithUser("wrongUser")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ chủ xe mới được phép giao xe");
    }

    @Test
    void receiveVehicle_wrongUser_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.DELIVERED)
                .user(User.builder().id("u1").build())
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        doReturn("u2").when(bookingService).extractUserIdFromToken(anyString());

        Assertions.assertThatThrownBy(() -> bookingService.receiveVehicle("b1", jwtWithUser("u2")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Chỉ người thuê xe mới được xác nhận đã nhận xe.");
    }

    @Test
    void receiveVehicle_invalidStatus_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.CONFIRMED)
                .user(User.builder().id("u1").build())
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        Assertions.assertThatThrownBy(() -> bookingService.receiveVehicle("b1", jwtWithUser("u1")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("trạng thái DELIVERED mới được xác nhận");
    }

    @Test
    void payBookingWithWallet_insufficientBalance_shouldThrow() {
        Booking booking = Booking.builder()
                .id("b1")
                .status(Booking.Status.UNPAID)
                .user(User.builder().id("u1").build())
                .totalCost(BigDecimal.valueOf(500000))
                .build();
        Wallet wallet = Wallet.builder()
                .user(User.builder().id("u1").build())
                .balance(BigDecimal.valueOf(300000))
                .build();
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        when(walletRepository.findByUserId("u1")).thenReturn(Optional.of(wallet));
        Assertions.assertThatThrownBy(() -> bookingService.payBookingWithWallet("b1", jwtWithUser("u1")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("không đủ để thanh toán đơn");
    }
    @Test
    void checkAvailability_unavailable() throws Exception {
        Mockito.when(bookingService.isTimeSlotAvailable(any(), any(), any())).thenReturn(false);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/bookings/check-availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" +
                                "\"vehicleId\":\"v1\"," +
                                "\"startTime\":\"2025-08-01T09:00:00\"," +
                                "\"endTime\":\"2025-08-01T11:00:00\"}")
                        .with(authentication(mockJwtAuthenticationToken))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void getBookingsByUserIdAndStatus_success() throws Exception {
        Mockito.when(bookingService.getBookingsByUserIdAndStatus("u1", "CONFIRMED")).thenReturn(List.of());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/bookings/user/u1/status/CONFIRMED")
                        .with(authentication(mockJwtAuthenticationToken)))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByProviderIdAndStatus_success() throws Exception {
        Mockito.when(bookingService.getBookingsByProviderIdAndStatus("p1", "CONFIRMED")).thenReturn(List.of());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/bookings/provider/p1/status/CONFIRMED")
                        .with(authentication(mockJwtAuthenticationToken)))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByUserIdAndDateRange_success() throws Exception {
        Mockito.when(bookingService.getBookingsByUserIdAndDateRange(anyString(), any(), any())).thenReturn(List.of());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/bookings/user/u1/date-range")
                        .param("startDate", LocalDateTime.now().minusDays(1).toString())
                        .param("endDate", LocalDateTime.now().plusDays(1).toString())
                        .with(authentication(mockJwtAuthenticationToken)))
                .andExpect(status().isOk());
    }
}
