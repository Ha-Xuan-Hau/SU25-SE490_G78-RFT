package com.rft.rft_be.service;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.entity.*;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.rating.RatingServiceImpl;
import com.rft.rft_be.service.report.ReportService;
import com.rft.rft_be.dto.report.ReportRequest;
import com.rft.rft_be.util.ProfanityValidator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @InjectMocks
    private RatingServiceImpl ratingService;

    @Mock private RatingRepository ratingRepo;
    @Mock private VehicleRepository vehicleRepo;
    @Mock private BookingRepository bookingRepo;
    @Mock private RatingMapper ratingMapper;
    @Mock private ReportService reportService;

    private RatingDTO dto;
    private Booking booking;
    private Vehicle vehicle;
    private Rating rating;

    @BeforeEach
    void setup() {
        dto = new RatingDTO("id", "user1", "vehicle1", "booking1", "Nice trip", 5,
                LocalDateTime.now(), LocalDateTime.now());

        booking = new Booking();
        booking.setId("booking1");
        booking.setStatus(Booking.Status.COMPLETED);
        booking.setUser(new User());

        vehicle = new Vehicle();
        vehicle.setId("vehicle1");

        rating = Rating.builder()
                .id("id")
                .comment("Nice trip")
                .star(5)
                .user(booking.getUser())
                .vehicle(vehicle)
                .booking(booking)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createRating_success_newRating() {
        when(bookingRepo.findById("booking1")).thenReturn(Optional.of(booking));
        when(vehicleRepo.findById("vehicle1")).thenReturn(Optional.of(vehicle));
        when(ratingRepo.findByBookingIdAndVehicleId("booking1", "vehicle1")).thenReturn(Optional.empty());
        when(ratingMapper.toEntity(dto)).thenReturn(rating);
        when(ratingRepo.save(any(Rating.class))).thenReturn(rating);
        when(ratingMapper.toDTO(any(Rating.class))).thenReturn(dto);
        when(ratingRepo.findAllByVehicleId("vehicle1")).thenReturn(List.of(rating));

        RatingDTO result = ratingService.createOrUpdateRating(dto);

        assertNotNull(result);
        assertEquals("Nice trip", result.getComment());
        verify(ratingRepo).save(any());
        verify(vehicleRepo).save(any());
    }

    @Test
    void updateRating_success_existingRating() {
        when(bookingRepo.findById("booking1")).thenReturn(Optional.of(booking));
        when(vehicleRepo.findById("vehicle1")).thenReturn(Optional.of(vehicle));
        when(ratingRepo.findByBookingIdAndVehicleId("booking1", "vehicle1")).thenReturn(Optional.of(rating));
        when(ratingRepo.save(any(Rating.class))).thenReturn(rating);
        when(ratingMapper.toDTO(any(Rating.class))).thenReturn(dto);
        when(ratingRepo.findAllByVehicleId("vehicle1")).thenReturn(List.of(rating));

        RatingDTO result = ratingService.createOrUpdateRating(dto);

        assertNotNull(result);
        verify(ratingRepo).save(rating);
    }

    @Test
    void createRating_throw_whenBookingNotFound() {
        when(bookingRepo.findById("booking1")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                ratingService.createOrUpdateRating(dto));
        assertEquals("Không tìm thấy đơn đặt xe.", ex.getMessage());
    }

    @Test
    void createRating_throw_whenBookingNotCompleted() {
        booking.setStatus(Booking.Status.PENDING);
        when(bookingRepo.findById("booking1")).thenReturn(Optional.of(booking));
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                ratingService.createOrUpdateRating(dto));
        assertTrue(ex.getMessage().contains("Chỉ đơn đã hoàn thành"));
    }

    @Test
    void createRating_throw_whenVehicleNotFound() {
        when(bookingRepo.findById("booking1")).thenReturn(Optional.of(booking));
        when(vehicleRepo.findById("vehicle1")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                ratingService.createOrUpdateRating(dto));
        assertEquals("Không tìm thấy phương tiện.", ex.getMessage());
    }

    @Test
    void createRating_throw_whenCommentHasProfanity() {
        dto.setComment("badword");
        when(bookingRepo.findById("booking1")).thenReturn(Optional.of(booking));
        when(vehicleRepo.findById("vehicle1")).thenReturn(Optional.of(vehicle));

        try (MockedStatic<ProfanityValidator> mockValidator = mockStatic(ProfanityValidator.class)) {
            mockValidator.when(() -> ProfanityValidator.containsProfanity("badword")).thenReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class, () ->
                    ratingService.createOrUpdateRating(dto));

            assertTrue(ex.getMessage().contains("ngôn từ không phù hợp"));
            verify(reportService).report(any(), any(ReportRequest.class));
        }
    }

    @Test
    void testDeleteRating_success() {
        Rating rating = new Rating();
        rating.setId("rating1");
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");
        rating.setVehicle(vehicle);

        when(ratingRepo.findById("rating1")).thenReturn(Optional.of(rating));
        when(ratingRepo.findAllByVehicleId("v1")).thenReturn(List.of());

        ratingService.deleteRating("rating1");

        verify(ratingRepo).deleteById("rating1");
    }

    @Test
    void testDeleteRating_notFound() {
        when(ratingRepo.findById("notfound")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> ratingService.deleteRating("notfound"));
    }

    @Test
    void testUpdateTotalRatingForVehicle_success() {
        Rating r1 = new Rating(); r1.setStar(5);
        Rating r2 = new Rating(); r2.setStar(3);
        List<Rating> ratings = List.of(r1, r2);

        Vehicle vehicle = new Vehicle(); vehicle.setId("v1");

        when(ratingRepo.findAllByVehicleId("v1")).thenReturn(ratings);
        when(vehicleRepo.findById("v1")).thenReturn(Optional.of(vehicle));

        ratingService.updateTotalRatingForVehicle("v1");

        verify(vehicleRepo).save(vehicle);
        assertEquals(2, vehicle.getTotalRatings());
    }

    @Test
    void testUpdateTotalRating_noRatings() {
        when(ratingRepo.findAllByVehicleId("v1")).thenReturn(Collections.emptyList());
        ratingService.updateTotalRatingForVehicle("v1");
        verify(vehicleRepo, never()).save(any());
    }

    @Test
    void testUpdateTotalRating_vehicleNotFound() {
        Rating mockRating = new Rating();
        mockRating.setStar(4);

        // ⚠️ Phải không rỗng để logic tiếp tục đến đoạn throw
        when(ratingRepo.findAllByVehicleId("v1")).thenReturn(List.of(mockRating));
        when(vehicleRepo.findById("v1")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                ratingService.updateTotalRatingForVehicle("v1"));

        assertEquals("Không tìm thấy phương tiện.", ex.getMessage());
    }

    @Test
    void testGetRatingsByVehicleId() {
        when(ratingRepo.findAllByVehicleId("v1")).thenReturn(List.of(rating));
        when(ratingMapper.toDTO(any())).thenReturn(dto);

        List<RatingDTO> result = ratingService.getRatingsByVehicleId("v1");

        assertEquals(1, result.size());
    }

    @Test
    void testGetRatingsByUserId() {
        when(ratingRepo.findAllByUserId("user1")).thenReturn(List.of(rating));
        when(ratingMapper.toDTO(any())).thenReturn(dto);

        List<RatingDTO> result = ratingService.getRatingsByUserId("user1");

        assertEquals(1, result.size());
    }

    @Test
    void testGetUserCommentsByVehicleId() {
        when(ratingRepo.findAllWithUserByVehicleId("vehicle1")).thenReturn(List.of(rating));
        UserCommentDTO commentDTO = new UserCommentDTO();
        commentDTO.setComment("good"); commentDTO.setStar(4);

        when(ratingMapper.RatingToUserCommentDTO(any())).thenReturn(commentDTO);

        List<UserCommentDTO> result = ratingService.getUserCommentsByVehicleId("vehicle1");

        assertEquals(1, result.size());
    }
}

