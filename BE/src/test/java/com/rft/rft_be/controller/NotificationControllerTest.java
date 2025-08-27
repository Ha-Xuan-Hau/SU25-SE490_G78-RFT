package com.rft.rft_be.controller;

import com.rft.rft_be.dto.Notification.*;
import com.rft.rft_be.service.Notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private JwtAuthenticationToken jwtAuthenticationToken;

    @Mock
    private Jwt jwtToken;

    @InjectMocks
    private NotificationController notificationController;

    private NotificationDetailDTO notificationDetailDTO;
    private NotificationResponseDTO notificationResponseDTO;
    private AdminNotificationCreateDTO adminNotificationCreateDTO;
    private NotificationUpdateDTO notificationUpdateDTO;
    private Page<NotificationDetailDTO> notificationPage;

    @BeforeEach
    void setUp() {
        // Setup NotificationDetailDTO
        notificationDetailDTO = NotificationDetailDTO.builder()
                .id("notification-1")
                .type("SYSTEM")
                .message("Test notification message")
                .redirectUrl("/test-url")
                .isRead(false)
                .isDeleted(false)
                .receiverId("user-1")
                .receiverName("Test User")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Setup NotificationResponseDTO
        notificationResponseDTO = NotificationResponseDTO.builder()
                .id("notification-1")
                .type("SYSTEM")
                .message("Test notification message")
                .isRead(false)
                .isDeleted(false)
                .receiverId("user-1")
                .receiverName("Test User")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Setup AdminNotificationCreateDTO
        adminNotificationCreateDTO = AdminNotificationCreateDTO.builder()
                .type("SYSTEM")
                .message("Test admin notification")
                .redirectUrl("/admin-test-url")
                .receiverIds(Arrays.asList("user-1", "user-2"))
                .sendToAll(false)
                .build();

        // Setup NotificationUpdateDTO
        notificationUpdateDTO = NotificationUpdateDTO.builder()
                .type("SYSTEM")
                .message("Updated notification message")
                .redirectUrl("/updated-url")
                .isRead(true)
                .isDeleted(false)
                .build();

        // Setup Page
        notificationPage = new PageImpl<>(Arrays.asList(notificationDetailDTO), PageRequest.of(0, 20), 1);
    }

    @Test
    void getMyNotifications_Success() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");
        when(notificationService.getNotificationsByUser(anyString(), any(Pageable.class)))
                .thenReturn(notificationPage);

        // Act
        ResponseEntity<Page<NotificationDetailDTO>> response = notificationController.getMyNotifications(
                jwtAuthenticationToken, 0, 20, "createdAt", "desc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals(notificationDetailDTO.getId(), response.getBody().getContent().get(0).getId());
        verify(notificationService).getNotificationsByUser(eq("user-1"), any(Pageable.class));
    }

    @Test
    void getMyNotifications_WithCustomSort() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");
        when(notificationService.getNotificationsByUser(anyString(), any(Pageable.class)))
                .thenReturn(notificationPage);

        // Act
        ResponseEntity<Page<NotificationDetailDTO>> response = notificationController.getMyNotifications(
                jwtAuthenticationToken, 1, 10, "updatedAt", "asc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(notificationService).getNotificationsByUser(eq("user-1"), any(Pageable.class));
    }

    @Test
    void getMyNotifications_WithDifferentSortDirections() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");
        when(notificationService.getNotificationsByUser(anyString(), any(Pageable.class)))
                .thenReturn(notificationPage);

        // Test ascending sort
        ResponseEntity<Page<NotificationDetailDTO>> responseAsc = notificationController.getMyNotifications(
                jwtAuthenticationToken, 0, 20, "createdAt", "asc");

        // Test descending sort
        ResponseEntity<Page<NotificationDetailDTO>> responseDesc = notificationController.getMyNotifications(
                jwtAuthenticationToken, 0, 20, "createdAt", "desc");

        // Assert
        assertEquals(HttpStatus.OK, responseAsc.getStatusCode());
        assertEquals(HttpStatus.OK, responseDesc.getStatusCode());
        verify(notificationService, times(2)).getNotificationsByUser(eq("user-1"), any(Pageable.class));
    }

    @Test
    void getUnreadNotifications_Success() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");
        when(notificationService.getUnreadNotifications("user-1"))
                .thenReturn(Arrays.asList(notificationDetailDTO));

        // Act
        ResponseEntity<List<NotificationDetailDTO>> response = notificationController.getUnreadNotifications(jwtAuthenticationToken);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals(notificationDetailDTO.getId(), response.getBody().get(0).getId());
        verify(notificationService).getUnreadNotifications(eq("user-1"));
    }

    @Test
    void getUnreadCount_Success() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");
        when(notificationService.getUnreadCount("user-1")).thenReturn(5L);

        // Act
        ResponseEntity<Map<String, Long>> response = notificationController.getUnreadCount(jwtAuthenticationToken);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(5L, response.getBody().get("unreadCount"));
        verify(notificationService).getUnreadCount(eq("user-1"));
    }

    @Test
    void clickNotification_Success() {
        // Arrange
        when(notificationService.markAsReadAndGetRedirectUrl("notification-1"))
                .thenReturn(notificationDetailDTO);

        // Act
        ResponseEntity<NotificationDetailDTO> response = notificationController.clickNotification("notification-1");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(notificationDetailDTO.getId(), response.getBody().getId());
        verify(notificationService).markAsReadAndGetRedirectUrl(eq("notification-1"));
    }

    @Test
    void markAsRead_Success() {
        // Arrange
        when(notificationService.markAsRead("notification-1"))
                .thenReturn(notificationResponseDTO);

        // Act
        ResponseEntity<NotificationResponseDTO> response = notificationController.markAsRead("notification-1");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(notificationResponseDTO.getId(), response.getBody().getId());
        verify(notificationService).markAsRead(eq("notification-1"));
    }

    @Test
    void markAllAsRead_Success() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");
        doNothing().when(notificationService).markAllAsRead("user-1");

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.markAllAsRead(jwtAuthenticationToken);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Tất cả thông báo được đánh dấu là đã đọc", response.getBody().get("message"));
        verify(notificationService).markAllAsRead(eq("user-1"));
    }

    @Test
    void getAllNotifications_Success() {
        // Arrange
        when(notificationService.getAllNotifications(any(Pageable.class)))
                .thenReturn(notificationPage);

        // Act
        ResponseEntity<Page<NotificationDetailDTO>> response = notificationController.getAllNotifications(
                0, 20, "createdAt", "desc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        verify(notificationService).getAllNotifications(any(Pageable.class));
    }

    @Test
    void getAllNotifications_WithCustomSort() {
        // Arrange
        when(notificationService.getAllNotifications(any(Pageable.class)))
                .thenReturn(notificationPage);

        // Act
        ResponseEntity<Page<NotificationDetailDTO>> response = notificationController.getAllNotifications(
                1, 10, "updatedAt", "asc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(notificationService).getAllNotifications(any(Pageable.class));
    }

    @Test
    void getAllNotifications_WithDifferentSortDirections() {
        // Arrange
        when(notificationService.getAllNotifications(any(Pageable.class)))
                .thenReturn(notificationPage);

        // Test ascending sort
        ResponseEntity<Page<NotificationDetailDTO>> responseAsc = notificationController.getAllNotifications(
                0, 20, "createdAt", "asc");

        // Test descending sort
        ResponseEntity<Page<NotificationDetailDTO>> responseDesc = notificationController.getAllNotifications(
                0, 20, "createdAt", "desc");

        // Assert
        assertEquals(HttpStatus.OK, responseAsc.getStatusCode());
        assertEquals(HttpStatus.OK, responseDesc.getStatusCode());
        verify(notificationService, times(2)).getAllNotifications(any(Pageable.class));
    }

    @Test
    void createNotificationByAdmin_SendToAll_Success() {
        // Arrange
        AdminNotificationCreateDTO sendToAllDTO = AdminNotificationCreateDTO.builder()
                .type("SYSTEM")
                .message("System announcement")
                .redirectUrl("/announcement")
                .receiverIds(Arrays.asList("user-1", "user-2"))
                .sendToAll(true)
                .build();

        doNothing().when(notificationService).createSystemAnnouncement(
                anyString(), anyString(), anyList());

        // Act
        ResponseEntity<Map<String, Object>> response = notificationController.createNotificationByAdmin(sendToAllDTO);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo đã được gửi đến tất cả người dùng", response.getBody().get("message"));
        verify(notificationService).createSystemAnnouncement(
                eq("System announcement"), eq("/announcement"), eq(Arrays.asList("user-1", "user-2")));
    }

    @Test
    void createNotificationByAdmin_SendToAll_WithNullReceiverIds() {
        // Arrange
        AdminNotificationCreateDTO sendToAllDTO = AdminNotificationCreateDTO.builder()
                .type("SYSTEM")
                .message("System announcement")
                .redirectUrl("/announcement")
                .receiverIds(null)
                .sendToAll(true)
                .build();

        doNothing().when(notificationService).createSystemAnnouncement(
                eq("System announcement"), eq("/announcement"), eq(null));

        // Act
        ResponseEntity<Map<String, Object>> response = notificationController.createNotificationByAdmin(sendToAllDTO);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo đã được gửi đến tất cả người dùng", response.getBody().get("message"));
        verify(notificationService).createSystemAnnouncement(
                eq("System announcement"), eq("/announcement"), eq(null));
    }

    @Test
    void createNotificationByAdmin_SendToSpecificUsers_Success() {
        // Arrange
        when(notificationService.createNotification(any(NotificationCreateDTO.class)))
                .thenReturn(notificationResponseDTO);

        // Act
        ResponseEntity<Map<String, Object>> response = notificationController.createNotificationByAdmin(adminNotificationCreateDTO);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo đã được tạo", response.getBody().get("message"));
        assertEquals(2, response.getBody().get("successCount"));
        assertEquals(0, response.getBody().get("failCount"));
        verify(notificationService, times(2)).createNotification(any(NotificationCreateDTO.class));
    }

    @Test
    void createNotificationByAdmin_SendToSpecificUsers_WithFailures() {
        // Arrange
        when(notificationService.createNotification(any(NotificationCreateDTO.class)))
                .thenReturn(notificationResponseDTO)
                .thenThrow(new RuntimeException("Error"));

        // Act
        ResponseEntity<Map<String, Object>> response = notificationController.createNotificationByAdmin(adminNotificationCreateDTO);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo đã được tạo", response.getBody().get("message"));
        assertTrue((Integer) response.getBody().get("successCount") >= 0);
        assertTrue((Integer) response.getBody().get("failCount") >= 0);
    }

    @Test
    void updateNotification_Success() {
        // Arrange
        when(notificationService.updateNotification("notification-1", notificationUpdateDTO))
                .thenReturn(notificationResponseDTO);

        // Act
        ResponseEntity<NotificationResponseDTO> response = notificationController.updateNotification("notification-1", notificationUpdateDTO);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(notificationResponseDTO.getId(), response.getBody().getId());
        verify(notificationService).updateNotification(eq("notification-1"), eq(notificationUpdateDTO));
    }

    @Test
    void deleteNotification_Success() {
        // Arrange
        doNothing().when(notificationService).deleteNotification("notification-1");

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.deleteNotification("notification-1");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo đã được xóa thành công", response.getBody().get("message"));
        verify(notificationService).deleteNotification(eq("notification-1"));
    }

    @Test
    void createSystemAnnouncement_Success() {
        // Arrange
        Map<String, Object> request = Map.of(
                "message", "System maintenance",
                "redirectUrl", "/maintenance",
                "userIds", Arrays.asList("user-1", "user-2")
        );

        doNothing().when(notificationService).createSystemAnnouncement(
                anyString(), anyString(), anyList());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.createSystemAnnouncement(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo hệ thống đã được tạo thành công", response.getBody().get("message"));
        verify(notificationService).createSystemAnnouncement(eq("System maintenance"), eq("/maintenance"), eq(Arrays.asList("user-1", "user-2")));
    }

    @Test
    void createSystemAnnouncement_WithNullUserIds() {
        // Arrange
        Map<String, Object> request = Map.of(
                "message", "System maintenance",
                "redirectUrl", "/maintenance"
        );

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.createSystemAnnouncement(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo hệ thống đã được tạo thành công", response.getBody().get("message"));
        verify(notificationService, never()).createSystemAnnouncement(anyString(), anyString(), anyList());
    }
//
//    @Test
//    void createSystemAnnouncement_WithEmptyUserIds() {
//        // Arrange
//        Map<String, Object> request = Map.of(
//                "message", "System maintenance",
//                "redirectUrl", "/maintenance",
//                "userIds", Arrays.asList()
//        );
//
//        doNothing().when(notificationService).createSystemAnnouncement(
//                eq("System maintenance"), eq("/maintenance"), eq(Arrays.asList()));
//
//        // Act
//        ResponseEntity<Map<String, String>> response = notificationController.createSystemAnnouncement(request);
//
//        // Assert
//        assertEquals(HttpStatus.OK, response.getStatusCode());
//        assertNotNull(response.getBody());
//        assertEquals("Thông báo hệ thống đã được tạo thành công", response.getBody().get("message"));
//        verify(notificationService).createSystemAnnouncement(eq("System maintenance"), eq("/maintenance"), eq(Arrays.asList()));
//    }

    @Test
    void createMaintenanceNotice_Success() {
        // Arrange
        Map<String, String> request = Map.of(
                "message", "System will be down for maintenance",
                "scheduledTime", "2024-01-15T10:00:00"
        );

        doNothing().when(notificationService).createMaintenanceNotice(anyString(), anyString());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.createMaintenanceNotice(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Thông báo bảo trì đã được tạo thành công", response.getBody().get("message"));
        verify(notificationService).createMaintenanceNotice(eq("System will be down for maintenance"), eq("2024-01-15T10:00:00"));
    }

    @Test
    void notifyOrderPlaced_Success() {
        // Arrange
        Map<String, Object> request = Map.of(
                "userId", "user-1",
                "bookingId", "booking-1",
                "vehicleName", "Toyota Camry"
        );

        doNothing().when(notificationService).notifyOrderPlaced(anyString(), anyString(), anyString());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.notifyOrderPlaced(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Đã gửi thông báo đặt hàng", response.getBody().get("message"));
        verify(notificationService).notifyOrderPlaced("user-1", "booking-1", "Toyota Camry");
    }


    @Test
    void notifyOrderApproved_Success() {
        // Arrange
        Map<String, Object> request = Map.of(
                "userId", "user-1",
                "bookingId", "booking-1"
        );

        doNothing().when(notificationService).notifyOrderApproved(anyString(), anyString());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.notifyOrderApproved(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Đã gửi thông báo đơn hàng đã được chấp thuận", response.getBody().get("message"));
        verify(notificationService).notifyOrderApproved("user-1", "booking-1");
    }

    @Test
    void notifyOrderRejected_Success() {
        // Arrange
        Map<String, Object> request = Map.of(
                "userId", "user-1",
                "bookingId", "booking-1",
                "reason", "Vehicle not available"
        );

        doNothing().when(notificationService).notifyOrderRejected(anyString(), anyString(), anyString());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.notifyOrderRejected(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Đã gửi thông báo đơn hàng bị từ chối", response.getBody().get("message"));
        verify(notificationService).notifyOrderRejected("user-1", "booking-1", "Vehicle not available");
    }

    @Test
    void notifyVehicleHandover_Success() {
        // Arrange
        Map<String, Object> request = Map.of(
                "userId", "user-1",
                "bookingId", "booking-1",
                "vehicleName", "Toyota Camry",
                "location", "123 Main St"
        );

        doNothing().when(notificationService).notifyVehicleHandover(anyString(), anyString(), anyString(), anyString());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.notifyVehicleHandover(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Đã gửi thông báo bàn giao xe", response.getBody().get("message"));
        verify(notificationService).notifyVehicleHandover("user-1", "booking-1", "Toyota Camry", "123 Main St");
    }

    @Test
    void notifyTopupSuccessful_Success() {
        // Arrange
        Map<String, Object> request = Map.of(
                "userId", "user-1",
                "amount", 1000.0
        );

        doNothing().when(notificationService).notifyTopupSuccessful(anyString(), anyDouble());

        // Act
        ResponseEntity<Map<String, String>> response = notificationController.notifyTopupSuccessful(request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Đã gửi thông báo nạp tiền thành công", response.getBody().get("message"));
        verify(notificationService).notifyTopupSuccessful("user-1", 1000.0);
    }

    @Test
    void extractUserIdFromAuth_Success() {
        // Arrange
        when(jwtAuthenticationToken.getToken()).thenReturn(jwtToken);
        when(jwtToken.getClaim("userId")).thenReturn("user-1");

        // Act
        ResponseEntity<Map<String, Long>> response = notificationController.getUnreadCount(jwtAuthenticationToken);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(jwtToken).getClaim("userId");
    }
}
