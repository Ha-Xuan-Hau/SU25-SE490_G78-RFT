package com.rft.rft_be.service;

import com.rft.rft_be.dto.UserDTO;
import com.rft.rft_be.dto.UserProfileDTO;

public interface UserService {
    UserDTO getProfile(String id);
    UserProfileDTO updateProfile(String id, UserProfileDTO dto);
}