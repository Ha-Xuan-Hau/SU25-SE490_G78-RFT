package com.rft.rft_be.mapper;


import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO toDTO(User user);
}