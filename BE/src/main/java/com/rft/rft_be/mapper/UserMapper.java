package com.rft.rft_be.mapper;



import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.entity.User;
import org.mapstruct.*;
import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.dto.user.UserRegisterDTO;
import com.rft.rft_be.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserDTO toUserDTO(User user);
    UserProfileDTO toUserProfileDTO(User user);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDTO(UserProfileDTO dto, @MappingTarget User user);


    UserDTO toDTO(User user);
    UserDetailDTO userToUserDetailDto(User user);
    User userDetailToUser(UserDetailDTO dto);

    UserRegisterDTO userToUserRegisterDto(User user);
    @BeanMapping(ignoreByDefault = true)
    User UserRegisterToUser(UserRegisterDTO dto);
}
