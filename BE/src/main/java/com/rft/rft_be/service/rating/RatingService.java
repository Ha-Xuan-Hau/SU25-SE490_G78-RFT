package com.rft.rft_be.service.rating;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;

import java.util.List;

public interface RatingService {
    RatingDTO createOrUpdateRating(RatingDTO dto);
    void deleteRating(String ratingId);
    void updateTotalRatingForVehicle(String vehicleId);

    List<RatingDTO> getRatingsByUserId(String userId);
    List<RatingDTO> getRatingsByVehicleId(String vehicleId);

    // bổ sung rõ ràng cho mục đích hiển thị đánh giá phía người dùng
    List<UserCommentDTO> getUserCommentsByVehicleId(String vehicleId);
}
