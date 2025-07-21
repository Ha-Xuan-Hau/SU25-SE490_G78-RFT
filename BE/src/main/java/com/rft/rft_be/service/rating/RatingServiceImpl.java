package com.rft.rft_be.service.rating;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.report.ReportRequest;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.Rating;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.report.ReportService;
import com.rft.rft_be.util.ProfanityValidator;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
    ReportService reportService;

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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt xe."));

        if (!"COMPLETED".equalsIgnoreCase(booking.getStatus().name())) {
            throw new RuntimeException("Chỉ đơn đã hoàn thành mới được phép đánh giá.");
        }

        if (dto.getVehicleId() == null || dto.getVehicleId().isBlank()) {
            throw new RuntimeException("Thiếu thông tin phương tiện cần đánh giá.");
        }

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương tiện."));

        if (ProfanityValidator.containsProfanity(dto.getComment())) {
            // Gửi report cho admin
            ReportRequest report = new ReportRequest();
            report.setTargetId(dto.getVehicleId()); // hoặc booking.getUser().getId() nếu muốn report user
            report.setReason("Từ ngữ không phù hợp trong đánh giá: " + dto.getComment());
            report.setType("SERIOUS_ERROR"); // hoặc định nghĩa type riêng nếu cần
            reportService.report(booking.getUser(), report);

            throw new RuntimeException("Bình luận chứa ngôn từ không phù hợp, không thể đăng đánh giá.");
        }
        Rating rating = ratingRepository.findByBookingIdAndVehicleId(dto.getBookingId(), dto.getVehicleId())
                .orElseGet(() -> {
                    Rating r = ratingMapper.toEntity(dto);
                    r.setCreatedAt(LocalDateTime.now());
                    return r;
                });

        rating.setStar(dto.getStar());
        rating.setComment(dto.getComment());
        rating.setBooking(booking);
        rating.setUser(booking.getUser());
        rating.setVehicle(vehicle);
        rating.setUpdatedAt(LocalDateTime.now());

        Rating saved = ratingRepository.save(rating);
        updateTotalRatingForVehicle(vehicle.getId());
        return ratingMapper.toDTO(saved);
    }

    @Override
    public void deleteRating(String ratingId) {
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá."));
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương tiện."));

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
