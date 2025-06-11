package com.rft.rft_be.service.user;

import com.rft.rft_be.dto.user.UserDetailDto;
import com.rft.rft_be.dto.user.UserRegisterDto;

public interface UserService {
    UserDetailDto register(UserRegisterDto dto);
}
