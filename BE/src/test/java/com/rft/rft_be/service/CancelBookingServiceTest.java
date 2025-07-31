//package com.rft.rft_be.service;
//
//import com.rft.rft_be.cleanUp.BookingCleanupTask;
//import com.rft.rft_be.dto.booking.CancelBookingRequestDTO;
//import com.rft.rft_be.entity.Booking;
//import com.rft.rft_be.entity.User;
//import com.rft.rft_be.entity.Vehicle;
//import com.rft.rft_be.mapper.BookingMapper;
//import com.rft.rft_be.mapper.BookingResponseMapper;
//import com.rft.rft_be.mapper.VehicleMapper;
//import com.rft.rft_be.repository.*;
//import com.rft.rft_be.service.Contract.FinalContractService;
//import com.rft.rft_be.service.booking.BookingServiceImpl;
//import jakarta.persistence.EntityNotFoundException;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.Mock;
//import org.mockito.Mockito;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.security.access.AccessDeniedException;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//public class CancelBookingServiceTest {
//    @Mock BookingMapper bookingMapper;
//    @Mock BookingRepository bookingRepository;
//    @Mock BookedTimeSlotRepository bookedTimeSlotRepository;
//    @Mock UserRepository userRepository;
//    @Mock VehicleRepository vehicleRepository;
//    @Mock VehicleMapper vehicleMapper;
//    @Mock BookingResponseMapper bookingResponseMapper;
//    @Mock
//    BookingCleanupTask bookingCleanupTask;
//    @Mock WalletRepository walletRepository;
//    @Mock WalletTransactionRepository walletTransactionRepository;
//    @Mock ContractRepository contractRepository;
//    @Mock CouponRepository couponRepository;
//    @Mock
//    FinalContractService finalContractService;
//
//    BookingServiceImpl bookingService;
//    User renter;
//    User provider;
//    Vehicle vehicle;
//    Booking booking;
//
//    @BeforeEach
//    void setUp() {
//        bookingService = new BookingServiceImpl(
//                bookingMapper, bookingRepository, bookedTimeSlotRepository, userRepository,
//                vehicleRepository, vehicleMapper, bookingResponseMapper, bookingCleanupTask,
//                walletRepository, walletTransactionRepository, contractRepository, couponRepository,
//                finalContractService
//        );
//        renter = User.builder().id("renter1").build();
//        provider = User.builder().id("provider1").build();
//        vehicle = Vehicle.builder().id("vehicle1").user(provider).build();
//        booking = Booking.builder()
//                .id("booking1")
//                .user(renter)
//                .vehicle(vehicle)
//                .status(Booking.Status.PENDING)
//                .timeBookingStart(LocalDateTime.now().plusHours(5))
//                .minCancelHour(3)
//                .penaltyType(Booking.PenaltyType.FIXED)
//                .penaltyValue(new BigDecimal("100000"))
//                .totalCost(new BigDecimal("500000"))
//                .build();
//    }
//
//    @Test
//    void cancelBooking_renter_success_noPenalty() {
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.of(booking));
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("renter1").when(spyService).extractUserIdFromToken(any());
//        spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO());
//        assertEquals(Booking.Status.CANCELLED, booking.getStatus());
//        assertEquals(BigDecimal.ZERO, booking.getPenaltyValue());
//        verify(bookingRepository).save(booking);
//    }
//
//    @Test
//    void cancelBooking_renter_late_penaltyApplied() {
//        booking.setPenaltyType(Booking.PenaltyType.FIXED);
//        booking.setPenaltyValue(new BigDecimal("100000"));
//        booking.setStatus(Booking.Status.PENDING);
//        booking.setMinCancelHour(3);
//        booking.setTimeBookingStart(LocalDateTime.now().plusMinutes(30)); // nhỏ hơn minCancelHour
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.of(booking));
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("renter1").when(spyService).extractUserIdFromToken(any());
//        spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO());
//        assertEquals(Booking.Status.CANCELLED, booking.getStatus());
//        assertEquals(new BigDecimal("0"), booking.getPenaltyValue());
//        verify(bookingRepository).save(booking);
//    }
//
//    @Test
//    void cancelBooking_provider_success() {
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.of(booking));
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("provider1").when(spyService).extractUserIdFromToken(any());
//        spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO());
//        assertEquals(Booking.Status.CANCELLED, booking.getStatus());
//        verify(bookingRepository).save(booking);
//    }
//
//    @Test
//    void cancelBooking_notRenterOrProvider_accessDenied() {
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.of(booking));
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("otherUser").when(spyService).extractUserIdFromToken(any());
//        assertThrows(AccessDeniedException.class, () -> spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO()));
//        verify(bookingRepository, never()).save(any());
//    }
//
//
//
//    @Test
//    void cancelBooking_bookingNotFound_entityNotFound() {
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.empty());
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("renter1").when(spyService).extractUserIdFromToken(any());
//        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class, () -> spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO()));
//        System.out.println("Exception message: " + ex.getMessage());
//        assertTrue(ex.getMessage().contains("Booking not found: booking1"));
//        verify(bookingRepository, never()).save(any());
//    }
//
//    @Test
//    void cancelBooking_notRenterOrProvider_accessDenied_message() {
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.of(booking));
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("otherUser").when(spyService).extractUserIdFromToken(any());
//        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO()));
//        System.out.println( ex.getMessage());
//        assertEquals("Chỉ người thuê xe hoặc chủ xe mới có quyền hủy đơn đặt.", ex.getMessage());
//        verify(bookingRepository, never()).save(any());
//    }
//
//    @Test
//    void cancelBooking_invalidStatus_illegalState_message() {
//        booking.setStatus(Booking.Status.RECEIVED_BY_CUSTOMER); // Đúng điều kiện ném exception
//        when(bookingRepository.findById("booking1")).thenReturn(Optional.of(booking));
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doReturn("renter1").when(spyService).extractUserIdFromToken(any());
//        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO()));
//        System.out.println( ex.getMessage());
//        assertEquals("Không thể hủy đơn đặt khi đã nhận, trả hoặc hoàn tất.", ex.getMessage());
//        verify(bookingRepository, never()).save(any());
//    }
//
//    @Test
//    void cancelBooking_extractUserIdFromToken_throwsRuntimeException_message() {
//        // KHÔNG mock bookingRepository.findById ở đây vì extractUserIdFromToken sẽ ném lỗi trước
//        BookingServiceImpl spyService = Mockito.spy(bookingService);
//        doThrow(new RuntimeException("Không thể lấy userId từ token")).when(spyService).extractUserIdFromToken(any());
//        RuntimeException ex = assertThrows(RuntimeException.class, () -> spyService.cancelBooking("booking1", "token", new CancelBookingRequestDTO()));
//        System.out.println(ex.getMessage());
//        assertEquals("Không thể lấy userId từ token", ex.getMessage());
//        verify(bookingRepository, never()).save(any());
//    }
//}
