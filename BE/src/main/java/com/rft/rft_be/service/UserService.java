package com.rft.rft_be.service;

import com.rft.rft_be.dto.UserDTO;

public interface UserService {
    UserDTO getProfile(String id);
}