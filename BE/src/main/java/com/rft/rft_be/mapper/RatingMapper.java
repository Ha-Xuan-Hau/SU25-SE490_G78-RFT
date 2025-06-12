package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.vehicle.UserCommentDTO;
import com.rft.rft_be.entity.Rating;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RatingMapper {
    @Mapping(target = "userName", source = "rating.user.fullName")
    @Mapping(target = "userImage", source = "rating.user.profilePicture")
    UserCommentDTO RatingToUserCommentDTO(Rating rating);
    List<UserCommentDTO> RatingToUserListCommentDTO(List<Rating> ratings);
}
