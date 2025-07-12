package com.rft.rft_be.service;
import com.rft.rft_be.cleanUp.BookingCleanupTask;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
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
    private User user;
    private Vehicle vehicle;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        request = BookingRequestDTO.builder()
                .vehicleId("vehicle_001")
                .timeBookingStart(LocalDateTime.of(2025, 9, 21, 10, 0))
                .timeBookingEnd(LocalDateTime.of(2025, 9, 29, 10, 0))
                .phoneNumber("0987654321")
                .address("12 Vo Thi Sau")
                .penaltyType("PERCENT")
                .penaltyValue(BigDecimal.valueOf(10))
                .minCancelHour(48)
                .pickupMethod("pickup")
                .build();

        user = User.builder()
                .id("user_001")
                .build();

        vehicle = Vehicle.builder()
                .id("vehicle_001")
                .costPerDay(BigDecimal.valueOf(500000))
                .user(User.builder().id("owner_123").build())
                .build();
    }

    // Booking thành công
    @Test
    void createBooking_success() {
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any())).thenReturn(java.util.Collections.emptyList());
        when(bookingRepository.existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(any(), any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        when(bookingResponseMapper.toResponseDTO(any())).thenReturn(new BookingResponseDTO());

        BookingResponseDTO response = bookingService.createBooking(request, "user_001");

        Assertions.assertThat(response).isNotNull();
        verify(bookingRepository, times(1)).save(any());
    }

    // Người dùng cố gắng đặt xe của chính mình
    @Test
    void createBooking_userBookingOwnVehicle_fail() {
        vehicle.setUser(user); // user is also the owner
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    //  Không tìm thấy xe
    @Test
    void createBooking_vehicleNotFound_fail() {
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    // Không tìm thấy người dùng
    @Test
    void createBooking_userNotFound_fail() {
        when(userRepository.findById("user_001")).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    // Thời gian bắt đầu sau thời gian kết thúc
    @Test
    void createBooking_invalidTimeRange_fail() {
        request.setTimeBookingEnd(LocalDateTime.of(2025, 9, 20, 10, 0)); // end < start
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    // Xe đã bị đặt trước trong khoảng thời gian đó
    @Test
    void createBooking_vehicleAlreadyBooked_fail() {
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(List.of(new BookedTimeSlot()));

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    // Người dùng đã có booking trùng thời gian chưa hoàn thành
    @Test
    void createBooking_alreadyHasActiveBooking_fail() {
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));
        when(bookedTimeSlotRepository.findByVehicleIdAndTimeRange(any(), any(), any()))
                .thenReturn(java.util.Collections.emptyList());
        when(bookingRepository.existsByUserIdAndVehicleIdAndTimeBookingStartAndTimeBookingEndAndStatusIn(any(), any(), any(), any(), any()))
                .thenReturn(true);

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    // Thời gian bắt đầu là null
    @Test
    void createBooking_nullStartTime_fail() {
        request.setTimeBookingStart(null);
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(ResponseStatusException.class);
    }

    // Số điện thoại sai định dạng
    @Test
    void createBooking_invalidPhoneFormat_fail() {
        request.setPhoneNumber("123abc");
        when(userRepository.findById("user_001")).thenReturn(Optional.of(user));
        when(vehicleRepository.findById("vehicle_001")).thenReturn(Optional.of(vehicle));

        Assertions.assertThatThrownBy(() ->
                bookingService.createBooking(request, "user_001")
        ).isInstanceOf(Exception.class); // Có thể bị chặn trước bởi validator
    }

}

