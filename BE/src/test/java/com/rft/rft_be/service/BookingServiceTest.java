package com.rft.rft_be.service;
import com.rft.rft_be.dto.booking.BookingCleanupTask;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.BookingResponseMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.booking.BookingServiceImpl;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class BookingServiceTest {

    @InjectMocks
    private BookingServiceImpl bookingService;

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

    private BookingRequestDTO request;
    private User user; // Đối tượng User cho người đặt xe (ID: user_003)
    private Vehicle vehicle; // Đối tượng Vehicle
    private User vehicleOwner; // Đối tượng User cho chủ xe (ID: user_001)

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

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

        // Khi bookingRepository.save được gọi với bất kỳ đối tượng Booking nào, trả về mockSavedBooking của chúng ta
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking bookingToSave = invocation.getArgument(0);
            bookingToSave.setId("booking_test_id_123"); // Gán ID đúng
            return bookingToSave;
        });

        // Giả lập BookingResponseDTO từ mapper (cũng thiết lập ID để khớp)
        BookingResponseDTO mockResponseDTO = new BookingResponseDTO();
        mockResponseDTO.setId("booking_test_id_123"); // Thiết lập ID cho DTO phản hồi
        when(bookingResponseMapper.toResponseDTO(any(Booking.class))).thenReturn(mockResponseDTO);

        // Mock scheduleCleanup để nó mong đợi ID cụ thể
        doNothing().when(bookingCleanupTask).scheduleCleanup(eq("booking_test_id_123"));

        BookingResponseDTO response = bookingService.createBooking(request, "user_003"); // Người đặt xe là user_003

        Assertions.assertThat(response).isNotNull();
        Assertions.assertThat(response.getId()).isEqualTo("booking_test_id_123");
        // Xác minh rằng phương thức save đã được gọi
        verify(bookingRepository, times(1)).save(any(Booking.class));
        // Xác minh rằng scheduleCleanup đã được gọi với ID chính xác
        verify(bookingCleanupTask, times(1)).scheduleCleanup(eq("booking_test_id_123"));
    }

    // Người dùng đặt xe của chính mình (user_003 đặt xe của user_003)
    @Test
    void createBooking_userBookingOwnVehicle_fail() {
        // Tạo một đối tượng User đặc biệt cho test này: user_003 là cả người đặt và chủ xe.
        // **QUAN TRỌNG:** user_003 này cũng phải có openTime/closeTime, định nghĩa là LocalDateTime.
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
}