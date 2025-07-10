package com.rft.rft_be.service;

import com.rft.rft_be.dto.vehicle.VehicleSearchDTO;
import com.rft.rft_be.dto.vehicle.VehicleSearchResultDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.vehicle.VehicleServiceImpl;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

public class SearchVehicleServiceTest {

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private BookedTimeSlotRepository bookedTimeSlotRepository;

    @Mock
    private RatingRepository ratingRepository;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    // Tìm xe thành công với 1 xe rảnh
    @Test
    void searchVehicle_success() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(List.of("CAR"))
                .pickupDateTime("2025-10-10T09:00:00")
                .returnDateTime("2025-10-12T18:00:00")
                .page(0).size(5)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .id("vehicle_001")
                .vehicleType(Vehicle.VehicleType.CAR)
                .costPerDay(BigDecimal.valueOf(800000))
                .user(User.builder().address("123 Lê Lợi").build())
                .status(Vehicle.Status.AVAILABLE) // <-- THÊM DÒNG NÀY ĐỂ ĐẶT TRẠNG THÁI
                .build();

        when(bookedTimeSlotRepository.findBusyVehicleIds(any(), any())).thenReturn(Collections.emptyList());
        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(vehicle)));
        when(ratingRepository.findAverageByVehicleId(anyString())).thenReturn(5.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request,
                LocalDateTime.parse(request.getPickupDateTime()),
                LocalDateTime.parse(request.getReturnDateTime()));

        Assertions.assertThat(result.getTotalElements()).isEqualTo(1);
        Assertions.assertThat(result.getContent().get(0).getId()).isEqualTo("vehicle_001");
    }

    //  Không có xe do đã được đặt trước
    @Test
    void searchVehicle_vehicleBusy_returnEmpty() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .pickupDateTime("2025-10-10T09:00:00")
                .returnDateTime("2025-10-12T18:00:00")
                .page(0).size(5)
                .build();

        when(bookedTimeSlotRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of("vehicle_001"));
        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(Page.empty());

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request,
                LocalDateTime.parse(request.getPickupDateTime()),
                LocalDateTime.parse(request.getReturnDateTime()));

        Assertions.assertThat(result.getTotalElements()).isZero();
    }

    // Chỉ tìm xe 5 sao
    @Test
    void searchVehicle_fiveStarFilter_success() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .ratingFiveStarsOnly(true)
                .pickupDateTime("2025-10-10T09:00:00")
                .returnDateTime("2025-10-12T18:00:00")
                .page(0).size(5)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .id("vehicle_001")
                .vehicleType(Vehicle.VehicleType.CAR)
                .user(User.builder().address("123 Lê Lợi").build())
                .status(Vehicle.Status.AVAILABLE) // <-- THÊM DÒNG NÀY
                .build();

        when(bookedTimeSlotRepository.findBusyVehicleIds(any(), any())).thenReturn(Collections.emptyList());
        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(vehicle)));
        when(ratingRepository.findAverageByVehicleId("vehicle_001")).thenReturn(5.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request,
                LocalDateTime.parse(request.getPickupDateTime()),
                LocalDateTime.parse(request.getReturnDateTime()));

        Assertions.assertThat(result.getTotalElements()).isEqualTo(1);
        Assertions.assertThat(result.getContent().get(0).getRating()).isEqualTo(5.0);
    }

    // costFrom > costTo → expect empty result
    @Test
    void searchVehicle_invalidPriceRange_returnEmpty() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .costFrom(2000000)
                .costTo(1000000)
                .pickupDateTime("2025-10-10T09:00:00")
                .returnDateTime("2025-10-12T18:00:00")
                .page(0).size(5)
                .build();

        when(bookedTimeSlotRepository.findBusyVehicleIds(any(), any())).thenReturn(Collections.emptyList());
        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(Page.empty());

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request,
                LocalDateTime.parse(request.getPickupDateTime()),
                LocalDateTime.parse(request.getReturnDateTime()));

        Assertions.assertThat(result.getTotalElements()).isZero();
    }

    // Không truyền thời gian → không filter thời gian
    @Test
    void searchVehicle_noTimeInput_success() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(List.of("CAR"))
                .page(0).size(5)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .id("vehicle_001")
                .vehicleType(Vehicle.VehicleType.CAR)
                .user(User.builder().address("123 Lê Lợi").build())
                .status(Vehicle.Status.AVAILABLE) // <-- THÊM DÒNG NÀY ĐỂ ĐẶT TRẠNG THÁI
                .build();

        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(vehicle)));
        when(ratingRepository.findAverageByVehicleId("vehicle_001")).thenReturn(4.5);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request, null, null);

        Assertions.assertThat(result.getTotalElements()).isEqualTo(1);
        Assertions.assertThat(result.getContent().get(0).getId()).isEqualTo("vehicle_001");
    }

    //  Tìm theo nhiều tiêu chí kết hợp: địa chỉ + loại xe + ghế
    @Test
    void searchVehicle_multipleFilters_success() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(List.of("CAR"))
                .addresses(List.of("Hà Nội"))
                .numberSeat(7)
                .pickupDateTime("2025-10-10T08:00:00")
                .returnDateTime("2025-10-12T20:00:00")
                .page(0).size(5)
                .build();

        Vehicle vehicle = Vehicle.builder()
                .id("vehicle_002")
                .vehicleType(Vehicle.VehicleType.CAR)
                .numberSeat(7)
                .user(User.builder().address("Hà Nội").build())
                // THÊM DÒNG NÀY ĐỂ SET TRẠNG THÁI CHO VEHICLE
                .status(Vehicle.Status.AVAILABLE) // Hoặc trạng thái mặc định nào đó bạn muốn
                .build();


        when(bookedTimeSlotRepository.findBusyVehicleIds(any(), any())).thenReturn(Collections.emptyList());
        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of(vehicle)));
        when(ratingRepository.findAverageByVehicleId("vehicle_002")).thenReturn(4.7);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request,
                LocalDateTime.parse(request.getPickupDateTime()),
                LocalDateTime.parse(request.getReturnDateTime()));

        Assertions.assertThat(result.getTotalElements()).isEqualTo(1);
        Assertions.assertThat(result.getContent().get(0).getId()).isEqualTo("vehicle_002");
        Assertions.assertThat(result.getContent().get(0).getRating()).isEqualTo(4.7);
    }

    //  Không tìm thấy xe với filter không khớp
    @Test
    void searchVehicle_noMatchingResult() {
        VehicleSearchDTO request = VehicleSearchDTO.builder()
                .vehicleTypes(List.of("BIKE"))
                .addresses(List.of("Cà Mau"))
                .pickupDateTime("2025-10-10T08:00:00")
                .returnDateTime("2025-10-12T20:00:00")
                .page(0).size(5)
                .build();

        when(bookedTimeSlotRepository.findBusyVehicleIds(any(), any())).thenReturn(Collections.emptyList());
        when(vehicleRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class))).thenReturn(Page.empty());

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(request,
                LocalDateTime.parse(request.getPickupDateTime()),
                LocalDateTime.parse(request.getReturnDateTime()));

        Assertions.assertThat(result.getTotalElements()).isZero();
    }
}
