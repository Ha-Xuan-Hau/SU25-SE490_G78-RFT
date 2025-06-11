package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.user.UserDetailDto;
import com.rft.rft_be.dto.user.UserRegisterDto;
import com.rft.rft_be.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDetailDto userToUserDetailDto(User user);
    User userDetailToUser(UserDetailDto dto);

    UserRegisterDto userToUserRegisterDto(User user);
    @BeanMapping(ignoreByDefault = true)
    User UserRegisterToUser(UserRegisterDto dto);
}
