package com.rft.rft_be.service.rating;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.VehicleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingServiceImpl implements RatingService{
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
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(dto.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        return null;
    }

    @Override
    public void deleteRating(String ratingId) {

    }

    @Override
    public void updateTotalRatingForVehicle(String vehicleId) {

    }

    @Override
    public List<RatingDTO> getRatingsByUserId(String userId) {
        return List.of();
    }


    @Override
    public List<UserCommentDTO> getUserCommentsByVehicleId(String vehicleId) {
        return ratingRepository.findAllByVehicleId(vehicleId)
                .stream()
                .map(ratingMapper::RatingToUserCommentDTO) // đảm bảo mapper có
                .collect(Collectors.toList());
    }
}
