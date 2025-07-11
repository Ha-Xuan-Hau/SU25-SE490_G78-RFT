package com.rft.rft_be.service;

import com.rft.rft_be.dto.contract.FinalContractDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;

import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.ContractRepository;
import com.rft.rft_be.service.Contract.FinalContractService;
import com.rft.rft_be.service.booking.BookingServiceImpl;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;



import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConfirmDeliveryServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private FinalContractService finalContractService;

    @Mock
    private BookedTimeSlotRepository bookedTimeSlotRepository;

    @Spy
    @InjectMocks
    private BookingServiceImpl bookingService;

    private Booking sharedBooking;
    private Vehicle sharedVehicle;
    private User sharedStaff;

    @BeforeEach
    void setUp() {
        sharedStaff = new User();
        sharedStaff.setId("staff-001");

        sharedVehicle = new Vehicle();
        sharedVehicle.setId("vehicle-001");
        sharedVehicle.setUser(sharedStaff);

        sharedBooking = new Booking();
        sharedBooking.setId("booking-001");
        sharedBooking.setVehicle(sharedVehicle);
        sharedBooking.setUser(sharedStaff);
        sharedBooking.setTimeBookingStart(LocalDateTime.now().plusHours(7));

        doReturn("staff-001").when(bookingService).extractUserIdFromToken(anyString());
    }

    @Test
    void deliverVehicle_withStaffRole_shouldSetStatusDelivered() {
        sharedBooking.setStatus(Booking.Status.CONFIRMED);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        bookingService.deliverVehicle("booking-001", "any-token");

        assertEquals(Booking.Status.DELIVERED, sharedBooking.getStatus());
        verify(bookingRepository).save(sharedBooking);
    }

    @Test
    void deliverVehicle_bookingNotFound_shouldThrowException() {
        when(bookingRepository.findById("not-found")).thenReturn(Optional.empty());
        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.deliverVehicle("not-found", "any-token");
        });
        assertTrue(exception.getMessage().contains("Booking not found: not-found"));
    }

    @Test
    void deliverVehicle_invalidBookingStatus_shouldThrowException() {
        sharedBooking.setStatus(Booking.Status.PENDING);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.deliverVehicle("booking-001", "any-token");
        });
        assertTrue(exception.getMessage().contains("Chỉ đơn đặt ở trạng thái CONFIRMED mới được giao xe"));
    }

    @Test
    void receiveVehicle_withUserRole_shouldSetStatusReceived() {
        sharedBooking.setStatus(Booking.Status.DELIVERED);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        bookingService.receiveVehicle("booking-001", "any-token");

        assertEquals(Booking.Status.RECEIVED_BY_CUSTOMER, sharedBooking.getStatus());
        verify(bookingRepository).save(sharedBooking);
    }

    @Test
    void receiveVehicle_invalidStatus_shouldThrowException() {
        sharedBooking.setStatus(Booking.Status.CONFIRMED);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.receiveVehicle("booking-001", "any-token");
        });
        assertTrue(exception.getMessage().contains("Chỉ đơn đặt ở trạng thái DELIVERED mới được xác nhận đã nhận xe"));
    }

    @Test
    void returnVehicle_withUserRole_shouldSetStatusReturned() {
        sharedBooking.setStatus(Booking.Status.RECEIVED_BY_CUSTOMER);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        bookingService.returnVehicle("booking-001", "any-token");

        assertEquals(Booking.Status.RETURNED, sharedBooking.getStatus());
        verify(bookingRepository).save(sharedBooking);
    }

    @Test
    void returnVehicle_invalidStatus_shouldThrowException() {
        sharedBooking.setStatus(Booking.Status.DELIVERED);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.returnVehicle("booking-001", "any-token");
        });
        assertTrue(exception.getMessage().contains("Chỉ đơn đặt ở trạng thái RECEIVED_BY_CUSTOMER mới được trả xe"));
    }

    @Test
    void completeOrder_withStaffRole_shouldSetStatusCompleted_andUpdateContract() {
        sharedBooking.setStatus(Booking.Status.RETURNED);

        FinalContractDTO finalContract = new FinalContractDTO();
        finalContract.setId("final-001");

        Contract contract = new Contract();
        contract.setId("contract-001");

        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));
        when(contractRepository.findByBookingId("booking-001")).thenReturn(List.of(contract));
        when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(contractRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(finalContractService.createFinalContract(any())).thenReturn(finalContract);

        bookingService.completeBooking("booking-001", "any-token", new BigDecimal("500000"), "Xe tốt");

        assertEquals(Booking.Status.COMPLETED, sharedBooking.getStatus());
        assertEquals(Contract.Status.FINISHED, contract.getStatus());
        verify(bookingRepository).save(sharedBooking);
        verify(contractRepository).save(contract);
        verify(finalContractService).createFinalContract(any());
    }

    @Test
    void completeOrder_invalidStatus_shouldThrowException() {
        sharedBooking.setStatus(Booking.Status.RECEIVED_BY_CUSTOMER);
        when(bookingRepository.findById("booking-001")).thenReturn(Optional.of(sharedBooking));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.completeBooking("booking-001", "any-token", new BigDecimal("500000"), "Note");
        });

        assertTrue(exception.getMessage().contains("Chỉ đơn đặt ở trạng thái RETURNED mới được hoàn tất"));
    }
}

