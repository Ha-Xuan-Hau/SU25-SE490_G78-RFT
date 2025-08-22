package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.dto.user.UserDetailDTO;
import com.rft.rft_be.entity.User;

import java.util.List;

public interface AdminUserService {
    
    /**
     * Lấy danh sách tất cả users với filter và pagination
     * Input: AdminUserSearchDTO (name, email, status, page, size)
     * Công dụng: Admin xem danh sách users để quản lý, có thể filter theo tên, email, trạng thái
     */
    AdminUserListResponseDTO getUsers(AdminUserSearchDTO searchDTO);


    AdminUserListResponseDTO getCustomers(AdminUserSearchDTO searchDTO);
    /**
     * Lấy danh sách chỉ providers (chủ xe) với filter và pagination
     * Input: AdminUserSearchDTO (name, email, status, page, size)
     * Công dụng: Admin xem danh sách providers riêng biệt để quản lý chủ xe
     */
    AdminUserListResponseDTO getProviders(AdminUserSearchDTO searchDTO);
    
    /**
     * Lấy thông tin chi tiết của 1 user (profile + payment data)
     * Input: userId
     * Công dụng: Admin xem thông tin đầy đủ của user bao gồm profile, booking history, rating, wallet
     */
    AdminUserDetailDTO getUserDetail(String userId);
    
    /**
     * Cập nhật trạng thái user (ACTIVE/INACTIVE)
     * Input: userId + AdminUserStatusUpdateDTO (status)
     * Công dụng: Admin có thể khóa/mở khóa tài khoản user
     */
    AdminUserDetailDTO updateUserStatus(String userId, AdminUserStatusUpdateDTO statusDTO);
    
    /**
     * Tìm kiếm users theo tên
     * Input: name, page, size
     * Công dụng: Admin tìm kiếm user theo tên để quản lý
     */
    AdminUserListResponseDTO searchUsersByName(String name, int page, int size);
    
    /**
     * Tìm kiếm users theo email
     * Input: email, page, size
     * Công dụng: Admin tìm kiếm user theo email để quản lý
     */
    AdminUserListResponseDTO searchUsersByEmail(String email, int page, int size);
    
    /**
     * Tìm kiếm users theo trạng thái (ACTIVE/INACTIVE)
     * Input: status, page, size
     * Công dụng: Admin lọc users theo trạng thái để quản lý
     */
    AdminUserListResponseDTO searchUsersByStatus(User.Status status, int page, int size);


    /**
     * Ban người dùng:
     * - Nếu USER có booking chưa hoàn thành (≠ COMPLETED/CANCELLED) -> TEMP_BANNED, ngược lại INACTIVE.
     * - Nếu PROVIDER có contract đang RENTING -> TEMP_BANNED, ngược lại INACTIVE.
     * * - Nếu PROVIDER có booking chưa hoàn thành (≠ COMPLETED/CANCELLED) -> TEMP_BANNED, ngược lại INACTIVE.
     * Trả về chi tiết user sau khi cập nhật.
     */
    AdminUserDetailDTO banUser(String userId);

    List<AdminStaffActivityDTO> getStaffActivities(String staffId);

     List<AdminStaffActivityGroupDTO> getAllStaffActivities();

    UserDetailDTO createStaffAccount(AdminCreateStaffDTO request);
} 