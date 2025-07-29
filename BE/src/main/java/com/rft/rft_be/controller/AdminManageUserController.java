package com.rft.rft_be.controller;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Notification;
import com.rft.rft_be.service.admin.AdminUserService;
import com.rft.rft_be.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/adminmanageusers")
@RequiredArgsConstructor
public class AdminManageUserController {

    private final AdminUserService adminUserService;
    private final NotificationRepository notificationRepository;

    // ==================== USER MANAGEMENT ENDPOINTS ====================

    //Lấy danh sách tất cả users vaf provider với filter và pagination
    @GetMapping
    public ResponseEntity<AdminUserListResponseDTO> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) User.Status status,
            @RequestParam(required = false) User.Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        AdminUserSearchDTO searchDTO = AdminUserSearchDTO.builder()
                .name(name)
                .email(email)
                .status(status)
                .role(role)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();
        
        return ResponseEntity.ok(adminUserService.getUsers(searchDTO));
    }

    //Lấy danh sách chỉ providers
    @GetMapping("/providers")
    public ResponseEntity<AdminUserListResponseDTO> getProviders(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) User.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        AdminUserSearchDTO searchDTO = AdminUserSearchDTO.builder()
                .name(name)
                .email(email)
                .status(status)
                .role(User.Role.PROVIDER)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();
        
        return ResponseEntity.ok(adminUserService.getProviders(searchDTO));
    }


    //Lấy danh sách chỉ người dùng
    @GetMapping("/customers")
    public ResponseEntity<AdminUserListResponseDTO> getCustomers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) User.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        AdminUserSearchDTO searchDTO = AdminUserSearchDTO.builder()
                .name(name)
                .email(email)
                .status(status)
                .role(User.Role.USER)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        return ResponseEntity.ok(adminUserService.getCustomers(searchDTO));
    }

    //Lấy thông tin chi tiết 1 user (profile + payment data)
    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserDetailDTO> getUserDetail(@PathVariable String userId) {
        return ResponseEntity.ok(adminUserService.getUserDetail(userId));
    }

    // Cập nhật trạng thái user (ACTIVE/INACTIVE)
    @PutMapping("/{userId}/status")
    public ResponseEntity<AdminUserDetailDTO> updateUserStatus(
            @PathVariable String userId,
            @RequestBody AdminUserStatusUpdateDTO statusDTO) {
        return ResponseEntity.ok(adminUserService.updateUserStatus(userId, statusDTO));
    }

    //Tìm kiếm users theo tên
    @GetMapping("/search/name")
    public ResponseEntity<AdminUserListResponseDTO> searchUsersByName(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.searchUsersByName(name, page, size));
    }

    //Tìm kiếm users theo email
    @GetMapping("/search/email")
    public ResponseEntity<AdminUserListResponseDTO> searchUsersByEmail(
            @RequestParam String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.searchUsersByEmail(email, page, size));
    }

    //Tìm kiếm users theo trạng thái
    @GetMapping("/search/status")
    public ResponseEntity<AdminUserListResponseDTO> searchUsersByStatus(
            @RequestParam User.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.searchUsersByStatus(status, page, size));
    }

    // ==================== NOTIFICATION MANAGEMENT ENDPOINTS ====================

    //Lấy tất cả notifications của 1 user
    @GetMapping("/{userId}/notifications")
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notificationPage = notificationRepository.findByReceiverId(userId, pageable);
        
        // Convert entities to DTOs to avoid Hibernate proxy issues
        List<AdminNotificationDTO> notificationDTOs = notificationPage.getContent().stream()
                .map(AdminNotificationDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notificationDTOs);
        response.put("totalElements", notificationPage.getTotalElements());
        response.put("totalPages", notificationPage.getTotalPages());
        response.put("currentPage", notificationPage.getNumber());
        response.put("pageSize", notificationPage.getSize());
        response.put("hasNext", notificationPage.hasNext());
        response.put("hasPrevious", notificationPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }

    //Lấy notifications chưa đọc của 1 user
    @GetMapping("/{userId}/notifications/unread")
    public ResponseEntity<Map<String, Object>> getUserUnreadNotifications(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notificationPage = notificationRepository.findByReceiverIdAndIsReadFalse(userId, pageable);
        
        // Convert entities to DTOs to avoid Hibernate proxy issues
        List<AdminNotificationDTO> notificationDTOs = notificationPage.getContent().stream()
                .map(AdminNotificationDTO::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notificationDTOs);
        response.put("totalElements", notificationPage.getTotalElements());
        response.put("totalPages", notificationPage.getTotalPages());
        response.put("currentPage", notificationPage.getNumber());
        response.put("pageSize", notificationPage.getSize());
        response.put("hasNext", notificationPage.hasNext());
        response.put("hasPrevious", notificationPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }

    // Lấy thống kê notifications (total/unread/read)
    @GetMapping("/{userId}/notifications/count")
    public ResponseEntity<Map<String, Object>> getUserNotificationCounts(@PathVariable String userId) {
        Long totalNotifications = notificationRepository.countByReceiverId(userId);
        Long unreadNotifications = notificationRepository.countByReceiverIdAndIsReadFalse(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalNotifications", totalNotifications);
        response.put("unreadNotifications", unreadNotifications);
        response.put("readNotifications", totalNotifications - unreadNotifications);
        
        return ResponseEntity.ok(response);
    }
} 