package com.rft.rft_be.service.rating;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.Rating;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.VehicleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingServiceImpl implements RatingService {
    RatingRepository ratingRepository;
    VehicleRepository vehicleRepository;
    BookingRepository bookingRepository;
    RatingMapper ratingMapper;

    @Override
    public List<RatingDTO> getRatingsByVehicleId(String id) {
        return ratingRepository.findAllByVehicleId(id)
                .stream()
                .map(ratingMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public RatingDTO createOrUpdateRating(RatingDTO dto) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"COMPLETED".equalsIgnoreCase(booking.getStatus().name())) {
            throw new RuntimeException("Only completed bookings can be rated.");
        }

        Rating rating = ratingRepository.findByBookingId(dto.getBookingId())
                .orElseGet(() -> {
                    Rating r = ratingMapper.toEntity(dto);
                    r.setCreatedAt(Instant.now());
                    return r;
                });

        rating.setStar(dto.getStar());
        rating.setComment(dto.getComment());
        rating.setBooking(booking);
        rating.setUser(booking.getUser());
        rating.setVehicle(booking.getVehicle());
        rating.setUpdatedAt(Instant.now());

        Rating saved = ratingRepository.save(rating);
        updateTotalRatingForVehicle(saved.getVehicle().getId());
        return ratingMapper.toDTO(saved);

    }

    @Override
    public void deleteRating(String ratingId) {
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new RuntimeException("Rating not found"));
        String vehicleId = rating.getVehicle().getId();
        ratingRepository.deleteById(ratingId);
        updateTotalRatingForVehicle(vehicleId);
    }

    @Override
    public void updateTotalRatingForVehicle(String vehicleId) {
        List<Rating> ratings = ratingRepository.findAllByVehicleId(vehicleId);
        if (ratings.isEmpty()) return;

        double average = ratings.stream()
                .mapToDouble(Rating::getStar)
                .average()
                .orElse(0);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        vehicle.setTotalRatings(ratings.size());
        vehicleRepository.save(vehicle);
    }

    @Override
    public List<RatingDTO> getRatingsByUserId(String userId) {
        return ratingRepository.findAllByUserId(userId)
                .stream()
                .map(ratingMapper::toDTO)
                .collect(Collectors.toList());
    }


    @Override
    public List<UserCommentDTO> getUserCommentsByVehicleId(String vehicleId) {
        return ratingRepository.findAllWithUserByVehicleId(vehicleId)
                .stream()
                .map(ratingMapper::RatingToUserCommentDTO)
                .collect(Collectors.toList());
    }
}
