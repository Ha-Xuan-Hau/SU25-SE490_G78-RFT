package com.rft.rft_be.mapper;



import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserDTO toUserDTO(User user);

    UserProfileDTO toUserProfileDTO(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDTO(UserProfileDTO dto, @MappingTarget User user);
}