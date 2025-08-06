package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.rating.RatingDTO;
import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.entity.Rating;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RatingMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "vehicle.id", target = "vehicleId")
    @Mapping(source = "booking.id", target = "bookingId")
    RatingDTO toDTO(Rating rating);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "vehicleId", target = "vehicle.id")
    @Mapping(source = "bookingId", target = "booking.id")
    Rating toEntity(RatingDTO dto);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "user.profilePicture", target = "userImage")
    UserCommentDTO RatingToUserCommentDTO(Rating rating);
    List<UserCommentDTO> RatingToUserListCommentDTO(List<Rating> ratings);
}
