package com.rft.rft_be.service.rating;

import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.repository.RatingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingServiceImpl implements RatingService{
    RatingRepository ratingRepository;
    @Override
    public List<UserCommentDTO> getRatingByVehicleId(String id) {
        return List.of();
    }
}
