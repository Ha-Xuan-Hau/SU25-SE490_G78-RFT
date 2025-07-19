package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.entity.User;

public interface AdminUserService {
    
    AdminUserListResponseDTO getUsers(AdminUserSearchDTO searchDTO);
    
    AdminUserListResponseDTO getProviders(AdminUserSearchDTO searchDTO);
    
    AdminUserDetailDTO getUserDetail(String userId);
    
    AdminUserDetailDTO updateUserStatus(String userId, AdminUserStatusUpdateDTO statusDTO);
    
    AdminUserListResponseDTO searchUsersByName(String name, int page, int size);
    
    AdminUserListResponseDTO searchUsersByEmail(String email, int page, int size);
    
    AdminUserListResponseDTO searchUsersByStatus(User.Status status, int page, int size);
} 