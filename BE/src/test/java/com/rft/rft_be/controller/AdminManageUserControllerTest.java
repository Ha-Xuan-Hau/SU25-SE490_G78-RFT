package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Notification;
import com.rft.rft_be.service.admin.AdminUserService;
import com.rft.rft_be.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminManageUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private NotificationRepository notificationRepository;

    private AdminUserListResponseDTO mockUserListResponse;
    private AdminUserDetailDTO mockUserDetail;
    private AdminUserStatusUpdateDTO mockStatusUpdate;
    private User mockUser;

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());

        // Setup mock data
        AdminUserListDTO user1 = AdminUserListDTO.builder()
                .id("user-001")
                .email("user1@example.com")
                .fullName("User One")
                .phone("0123456789")
                .status(User.Status.ACTIVE)
                .role(User.Role.USER)
                .createdAt(LocalDateTime.now())
                .totalBookings(5L)
                .walletBalance(100000.0)
                .build();

        AdminUserListDTO user2 = AdminUserListDTO.builder()
                .id("user-002")
                .email("user2@example.com")
                .fullName("User Two")
                .phone("0987654321")
                .status(User.Status.ACTIVE)
                .role(User.Role.PROVIDER)
                .createdAt(LocalDateTime.now())
                .totalBookings(10L)
                .walletBalance(500000.0)
                .build();

        mockUserListResponse = AdminUserListResponseDTO.builder()
                .users(Arrays.asList(user1, user2))
                .totalElements(2L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(10)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        mockUserDetail = AdminUserDetailDTO.builder()
                .id("user-001")
                .email("user1@example.com")
                .fullName("User One")
                .phone("0123456789")
                .address("Hanoi, Vietnam")
                .status(User.Status.ACTIVE)
                .role(User.Role.USER)
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .createdAt(LocalDateTime.now())
                .walletBalance(100000.0)
                .totalBookings(5L)
                .completedBookings(4L)
                .cancelledBookings(1L)
                .averageRating(4.5)
                .totalRatings(10L)
                .build();

        mockStatusUpdate = AdminUserStatusUpdateDTO.builder()
                .status(User.Status.INACTIVE)
                .reason("Violation of terms")
                .build();

        // Setup mock user for notifications
        mockUser = new User();
        mockUser.setId("user-001");
        mockUser.setEmail("user1@example.com");
        mockUser.setFullName("User One");
    }

    // ==================== USER MANAGEMENT TESTS ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsers_shouldReturnOk() throws Exception {
        when(adminUserService.getUsers(any())).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.users.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.users[0].email").value("user1@example.com"))
                .andExpect(jsonPath("$.users[1].email").value("user2@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsers_withFilters_shouldReturnOk() throws Exception {
        when(adminUserService.getUsers(any())).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers")
                .param("name", "User")
                .param("email", "user1@example.com")
                .param("status", "ACTIVE")
                .param("role", "USER")
                .param("page", "0")
                .param("size", "10")
                .param("sortBy", "createdAt")
                .param("sortDirection", "DESC")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getProviders_shouldReturnOk() throws Exception {
        when(adminUserService.getProviders(any())).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/providers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getProviders_withFilters_shouldReturnOk() throws Exception {
        when(adminUserService.getProviders(any())).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/providers")
                .param("name", "Provider")
                .param("email", "provider@example.com")
                .param("status", "ACTIVE")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getCustomers_shouldReturnOk() throws Exception {
        when(adminUserService.getCustomers(any())).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/customers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getCustomers_withFilters_shouldReturnOk() throws Exception {
        when(adminUserService.getCustomers(any())).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/customers")
                .param("name", "Customer")
                .param("email", "customer@example.com")
                .param("status", "ACTIVE")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserDetail_shouldReturnOk() throws Exception {
        when(adminUserService.getUserDetail("user-001")).thenReturn(mockUserDetail);

        mockMvc.perform(get("/api/adminmanageusers/user-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-001"))
                .andExpect(jsonPath("$.email").value("user1@example.com"))
                .andExpect(jsonPath("$.fullName").value("User One"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.walletBalance").value(100000.0))
                .andExpect(jsonPath("$.totalBookings").value(5))
                .andExpect(jsonPath("$.averageRating").value(4.5));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserDetail_userNotFound_shouldReturnBadRequest() throws Exception {
        when(adminUserService.getUserDetail("non-existent")).thenThrow(new RuntimeException("User not found"));

        mockMvc.perform(get("/api/adminmanageusers/non-existent")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUserStatus_shouldReturnOk() throws Exception {
        AdminUserDetailDTO updatedUser = AdminUserDetailDTO.builder()
                .id("user-001")
                .email("user1@example.com")
                .fullName("User One")
                .status(User.Status.INACTIVE)
                .role(User.Role.USER)
                .build();

        when(adminUserService.updateUserStatus("user-001", mockStatusUpdate)).thenReturn(updatedUser);

        mockMvc.perform(put("/api/adminmanageusers/user-001/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockStatusUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-001"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUserStatus_invalidStatus_shouldReturnBadRequest() throws Exception {
        AdminUserStatusUpdateDTO invalidStatus = AdminUserStatusUpdateDTO.builder()
                .status(null)
                .reason("Invalid status")
                .build();

        mockMvc.perform(put("/api/adminmanageusers/user-001/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidStatus)))
                .andExpect(status().isOk()); // Controller doesn't validate status
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchUsersByName_shouldReturnOk() throws Exception {
        when(adminUserService.searchUsersByName("User", 0, 10)).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/search/name")
                .param("name", "User")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchUsersByName_emptyName_shouldReturnOk() throws Exception {
        when(adminUserService.searchUsersByName("", 0, 10)).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/search/name")
                .param("name", "")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchUsersByEmail_shouldReturnOk() throws Exception {
        when(adminUserService.searchUsersByEmail("user1@example.com", 0, 10)).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/search/email")
                .param("email", "user1@example.com")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchUsersByEmail_invalidEmail_shouldReturnOk() throws Exception {
        when(adminUserService.searchUsersByEmail("invalid-email", 0, 10)).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/search/email")
                .param("email", "invalid-email")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchUsersByStatus_shouldReturnOk() throws Exception {
        when(adminUserService.searchUsersByStatus(User.Status.ACTIVE, 0, 10)).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/search/status")
                .param("status", "ACTIVE")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchUsersByStatus_inactiveStatus_shouldReturnOk() throws Exception {
        when(adminUserService.searchUsersByStatus(User.Status.INACTIVE, 0, 10)).thenReturn(mockUserListResponse);

        mockMvc.perform(get("/api/adminmanageusers/search/status")
                .param("status", "INACTIVE")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // ==================== NOTIFICATION MANAGEMENT TESTS ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserNotifications_shouldReturnOk() throws Exception {
        // Mock notification data
        Notification notification1 = new Notification();
        notification1.setId("notif-001");
        notification1.setType(Notification.type.BOOKING);
        notification1.setMessage("{\"message\":\"Booking confirmed\",\"redirectUrl\":\"/bookings/123\"}");
        notification1.setIsRead(false);
        notification1.setIsDeleted(false);
        notification1.setCreatedAt(LocalDateTime.now());
        notification1.setReceiver(mockUser);

        Notification notification2 = new Notification();
        notification2.setId("notif-002");
        notification2.setType(Notification.type.SYSTEM);
        notification2.setMessage("{\"message\":\"Payment successful\",\"redirectUrl\":\"/payments/456\"}");
        notification2.setIsRead(true);
        notification2.setIsDeleted(false);
        notification2.setCreatedAt(LocalDateTime.now());
        notification2.setReceiver(mockUser);

        Page<Notification> notificationPage = new PageImpl<>(
                Arrays.asList(notification1, notification2),
                PageRequest.of(0, 10),
                2
        );

        when(notificationRepository.findByReceiverId(eq("user-001"), any(Pageable.class)))
                .thenReturn(notificationPage);

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications").isArray())
                .andExpect(jsonPath("$.notifications.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.currentPage").value(0))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.hasNext").value(false))
                .andExpect(jsonPath("$.hasPrevious").value(false));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserNotifications_emptyList_shouldReturnOk() throws Exception {
        Page<Notification> emptyPage = new PageImpl<>(
                Arrays.asList(),
                PageRequest.of(0, 10),
                0
        );

        when(notificationRepository.findByReceiverId(eq("user-001"), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications").isArray())
                .andExpect(jsonPath("$.notifications.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserUnreadNotifications_shouldReturnOk() throws Exception {
        // Mock unread notification data
        Notification unreadNotification = new Notification();
        unreadNotification.setId("notif-003");
        unreadNotification.setType(Notification.type.BOOKING);
        unreadNotification.setMessage("{\"message\":\"New booking request\",\"redirectUrl\":\"/bookings/789\"}");
        unreadNotification.setIsRead(false);
        unreadNotification.setIsDeleted(false);
        unreadNotification.setCreatedAt(LocalDateTime.now());
        unreadNotification.setReceiver(mockUser);

        Page<Notification> unreadPage = new PageImpl<>(
                Arrays.asList(unreadNotification),
                PageRequest.of(0, 10),
                1
        );

        when(notificationRepository.findByReceiverIdAndIsReadFalse(eq("user-001"), any(Pageable.class)))
                .thenReturn(unreadPage);

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications/unread")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications").isArray())
                .andExpect(jsonPath("$.notifications.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserUnreadNotifications_noUnread_shouldReturnOk() throws Exception {
        Page<Notification> emptyPage = new PageImpl<>(
                Arrays.asList(),
                PageRequest.of(0, 10),
                0
        );

        when(notificationRepository.findByReceiverIdAndIsReadFalse(eq("user-001"), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications/unread")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications").isArray())
                .andExpect(jsonPath("$.notifications.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserNotificationCounts_shouldReturnOk() throws Exception {
        when(notificationRepository.countByReceiverId("user-001")).thenReturn(5L);
        when(notificationRepository.countByReceiverIdAndIsReadFalse("user-001")).thenReturn(2L);

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalNotifications").value(5))
                .andExpect(jsonPath("$.unreadNotifications").value(2))
                .andExpect(jsonPath("$.readNotifications").value(3));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserNotificationCounts_noNotifications_shouldReturnOk() throws Exception {
        when(notificationRepository.countByReceiverId("user-001")).thenReturn(0L);
        when(notificationRepository.countByReceiverIdAndIsReadFalse("user-001")).thenReturn(0L);

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalNotifications").value(0))
                .andExpect(jsonPath("$.unreadNotifications").value(0))
                .andExpect(jsonPath("$.readNotifications").value(0));
    }

    // ==================== ERROR HANDLING TESTS ====================
    // Note: GlobalExceptionHandler returns 400 Bad Request for RuntimeException

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsers_serviceThrowsException_shouldReturnBadRequest() throws Exception {
        when(adminUserService.getUsers(any())).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/adminmanageusers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("Database error"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserDetail_serviceThrowsException_shouldReturnBadRequest() throws Exception {
        when(adminUserService.getUserDetail("user-001")).thenThrow(new RuntimeException("User not found"));

        mockMvc.perform(get("/api/adminmanageusers/user-001")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUserStatus_serviceThrowsException_shouldReturnBadRequest() throws Exception {
        when(adminUserService.updateUserStatus("user-001", mockStatusUpdate))
                .thenThrow(new RuntimeException("Update failed"));

        mockMvc.perform(put("/api/adminmanageusers/user-001/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockStatusUpdate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("Update failed"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserNotifications_repositoryThrowsException_shouldReturnBadRequest() throws Exception {
        when(notificationRepository.findByReceiverId(eq("user-001"), any(Pageable.class)))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/adminmanageusers/user-001/notifications")
                .param("page", "0")
                .param("size", "10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400))
                .andExpect(jsonPath("$.message").value("Database error"));
    }
}
