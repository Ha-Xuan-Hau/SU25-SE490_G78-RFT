package com.rft.rft_be.service.user;

import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.dto.user.UserRegisterDTO;

public interface UserService {

    UserDetailDTO register(UserRegisterDTO dto);

    UserDTO getProfile(String id);

    UserProfileDTO updateProfile(String id, UserProfileDTO dto);

    String getUserIdFromToken(String token);
}
