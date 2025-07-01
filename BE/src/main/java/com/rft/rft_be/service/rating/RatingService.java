package com.rft.rft_be.service.rating;

import com.rft.rft_be.dto.vehicle.UserCommentDTO;

import java.util.List;

public interface RatingService {
    List<UserCommentDTO> getRatingByVehicleId(String id);

}
