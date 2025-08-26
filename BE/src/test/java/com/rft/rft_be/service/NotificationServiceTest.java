package com.rft.rft_be.service;

import com.rft.rft_be.dto.Notification.*;
import com.rft.rft_be.entity.Notification;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.repository.NotificationRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.Notification.NotificationServiceImpl;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationMapper notificationMapper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;
    private Notification testNotification;
    private NotificationCreateDTO createDTO;
    private NotificationUpdateDTO updateDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-123")
                .fullName("Test User")
                .email("test@example.com")
                .build();

        testNotification = Notification.builder()
                .id("notification-123")
                .type(Notification.type.BOOKING)
                .message("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}")
                .isRead(false)
                .isDeleted(false)
                .receiver(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        createDTO = NotificationCreateDTO.builder()
                .type("ORDER_PLACED")
                .message("Test message")
                .redirectUrl("/test")
                .receiverId("user-123")
                .build();

        updateDTO = NotificationUpdateDTO.builder()
                .type("ORDER_APPROVED")
                .message("Updated message")
                .redirectUrl("/updated")
                .isRead(true)
                .isDeleted(false)
                .build();
    }

    // Test createNotification method
    @Test
    void createNotification_Success() {
        // Arrange
        when(notificationMapper.isValidNotificationType("ORDER_PLACED")).thenReturn(true);
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.createMessageJson("Test message", "/test")).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType("ORDER_PLACED")).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
        when(notificationMapper.toResponseDTO(testNotification)).thenReturn(NotificationResponseDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .message("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}")
                .build());

        // Act
        NotificationResponseDTO result = notificationService.createNotification(createDTO);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("notification-123");
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createNotification_InvalidType_ThrowsException() {
        // Arrange
        when(notificationMapper.isValidNotificationType("INVALID_TYPE")).thenReturn(false);
        createDTO.setType("INVALID_TYPE");

        // Act & Assert
        assertThatThrownBy(() -> notificationService.createNotification(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid notification type");
    }

    @Test
    void createNotification_UserNotFound_ThrowsException() {
        // Arrange
        when(notificationMapper.isValidNotificationType("ORDER_PLACED")).thenReturn(true);
        when(userRepository.findById("user-123")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> notificationService.createNotification(createDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // Test updateNotification method
//    @Test
//    void updateNotification_Success() {
//        // Arrange
//        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
//        when(notificationMapper.isValidNotificationType("ORDER_APPROVED")).thenReturn(true);
//        when(notificationMapper.mapToDbType("ORDER_APPROVED")).thenReturn(Notification.type.BOOKING);
//        when(notificationMapper.parseMessageContent(anyString())).thenReturn(NotificationMessageContent.builder()
//                .message("Test message")
//                .redirectUrl("/test")
//                .build());
//        when(notificationMapper.createMessageJson("Updated message", "/updated")).thenReturn("{\"message\":\"Updated message\",\"redirectUrl\":\"/updated\"}");
//        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
//        when(notificationMapper.toResponseDTO(testNotification)).thenReturn(NotificationResponseDTO.builder()
//                .id("notification-123")
//                .type("BOOKING")
//                .build());
//
//        // Act
//        NotificationResponseDTO result = notificationService.updateNotification("notification-123", updateDTO);
//
//        // Assert
//        assertThat(result).isNotNull();
//        verify(notificationRepository).save(any(Notification.class));
//    }

    @Test
    void updateNotification_NotificationNotFound_ThrowsException() {
        // Arrange
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> notificationService.updateNotification("notification-123", updateDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Notification not found");
    }

    @Test
    void updateNotification_InvalidType_ThrowsException() {
        // Arrange
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
        when(notificationMapper.isValidNotificationType("INVALID_TYPE")).thenReturn(false);
        updateDTO.setType("INVALID_TYPE");

        // Act & Assert
        assertThatThrownBy(() -> notificationService.updateNotification("notification-123", updateDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid notification type");
    }

    // Test deleteNotification method
    @Test
    void deleteNotification_Success() {
        // Arrange
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.deleteNotification("notification-123");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
        assertThat(testNotification.getIsDeleted()).isTrue();
    }

    @Test
    void deleteNotification_NotificationNotFound_ThrowsException() {
        // Arrange
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> notificationService.deleteNotification("notification-123"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Notification not found");
    }

    // Test getNotificationsByUser method
    @Test
    void getNotificationsByUser_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> notificationPage = new PageImpl<>(Arrays.asList(testNotification));
        when(notificationRepository.findByReceiverIdAndNotDeleted("user-123", pageable)).thenReturn(notificationPage);
        when(notificationMapper.toDetailDTO(testNotification)).thenReturn(NotificationDetailDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .message("Test message")
                .build());

        // Act
        Page<NotificationDetailDTO> result = notificationService.getNotificationsByUser("user-123", pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("notification-123");
    }

    // Test getUnreadNotifications method
    @Test
    void getUnreadNotifications_Success() {
        // Arrange
        List<Notification> notifications = Arrays.asList(testNotification);
        when(notificationRepository.findUnreadByReceiverId("user-123")).thenReturn(notifications);
        when(notificationMapper.toDetailDTO(testNotification)).thenReturn(NotificationDetailDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .message("Test message")
                .build());

        // Act
        List<NotificationDetailDTO> result = notificationService.getUnreadNotifications("user-123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("notification-123");
    }

    // Test getUnreadCount method
    @Test
    void getUnreadCount_Success() {
        // Arrange
        when(notificationRepository.countUnreadByReceiverId("user-123")).thenReturn(5L);

        // Act
        Long result = notificationService.getUnreadCount("user-123");

        // Assert
        assertThat(result).isEqualTo(5L);
    }

    // Test getAllNotifications method
    @Test
    void getAllNotifications_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Notification> notificationPage = new PageImpl<>(Arrays.asList(testNotification));
        when(notificationRepository.findAll(pageable)).thenReturn(notificationPage);
        when(notificationMapper.toDetailDTO(testNotification)).thenReturn(NotificationDetailDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .message("Test message")
                .build());

        // Act
        Page<NotificationDetailDTO> result = notificationService.getAllNotifications(pageable);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
    }

    // Test markAsReadAndGetRedirectUrl method
    @Test
    void markAsReadAndGetRedirectUrl_Success() {
        // Arrange
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
        when(notificationMapper.toDetailDTO(testNotification)).thenReturn(NotificationDetailDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .message("Test message")
                .redirectUrl("/test")
                .build());

        // Act
        NotificationDetailDTO result = notificationService.markAsReadAndGetRedirectUrl("notification-123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("notification-123");
        assertThat(testNotification.getIsRead()).isTrue();
    }

    @Test
    void markAsReadAndGetRedirectUrl_AlreadyRead_DoesNotUpdate() {
        // Arrange
        testNotification.setIsRead(true);
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
        when(notificationMapper.toDetailDTO(testNotification)).thenReturn(NotificationDetailDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .message("Test message")
                .redirectUrl("/test")
                .build());

        // Act
        NotificationDetailDTO result = notificationService.markAsReadAndGetRedirectUrl("notification-123");

        // Assert
        assertThat(result).isNotNull();
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    // Test markAsRead method
    @Test
    void markAsRead_Success() {
        // Arrange
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
        when(notificationMapper.toResponseDTO(testNotification)).thenReturn(NotificationResponseDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .build());

        // Act
        NotificationResponseDTO result = notificationService.markAsRead("notification-123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("notification-123");
        assertThat(testNotification.getIsRead()).isTrue();
    }

    // Test markAllAsRead method
    @Test
    void markAllAsRead_Success() {
        // Arrange
        List<Notification> unreadNotifications = Arrays.asList(testNotification);
        when(notificationRepository.findUnreadByReceiverId("user-123")).thenReturn(unreadNotifications);
        when(notificationRepository.saveAll(unreadNotifications)).thenReturn(unreadNotifications);

        // Act
        notificationService.markAllAsRead("user-123");

        // Assert
        verify(notificationRepository).saveAll(unreadNotifications);
        assertThat(testNotification.getIsRead()).isTrue();
    }

    @Test
    void markAllAsRead_NoUnreadNotifications_DoesNothing() {
        // Arrange
        when(notificationRepository.findUnreadByReceiverId("user-123")).thenReturn(Arrays.asList());

        // Act
        notificationService.markAllAsRead("user-123");

        // Assert
        verify(notificationRepository, never()).saveAll(any());
    }

    // Test booking workflow notification methods
    @Test
    void notifyOrderPlaced_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatOrderPlacedMessage("Test Vehicle")).thenReturn("Đơn hàng của bạn cho xe Test Vehicle đã được đặt thành công");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.ORDER_PLACED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyOrderPlaced("user-123", "booking-123", "Test Vehicle");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyPaymentCompleted_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatPaymentCompletedMessage(1000.0)).thenReturn("Thanh toán 1000 VND cho đơn hàng đã hoàn thành");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.PAYMENT_COMPLETED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyPaymentCompleted("user-123", "provider-456", "booking-123", 1000.0);

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyOrderApproved_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.createMessageJson(NotificationMapper.ORDER_APPROVED_MSG, "/profile/booking-history"))
                .thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.ORDER_APPROVED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyOrderApproved("user-123", "booking-123");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyOrderRejected_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatOrderRejectedMessage("Invalid booking")).thenReturn("Đơn hàng của bạn đã bị từ chối. Lý do: Invalid booking");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.ORDER_REJECTED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyOrderRejected("user-123", "booking-123", "Invalid booking");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyOrderCanceled_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatOrderCanceledMessage("User canceled")).thenReturn("Đơn hàng đã bị hủy. Lý do: User canceled");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.ORDER_CANCELED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyOrderCanceled("user-123", "booking-123", "User canceled");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyBookingCompleted_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.createMessageJson(NotificationMapper.BOOKING_COMPLETED_MSG, "/booking-detail/booking-123"))
                .thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.BOOKING_COMPLETED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyBookingCompleted("user-123", "booking-123");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    // Test vehicle handover notification methods
    @Test
    void notifyVehicleHandover_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatVehicleHandoverMessage("Test Vehicle", "Test Location")).thenReturn("Xe Test Vehicle đã sẵn sàng để bàn giao tại Test Location");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.VEHICLE_HANDOVER)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyVehicleHandover("user-123", "booking-123", "Test Vehicle", "Test Location");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyVehiclePickupConfirmed_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatVehiclePickupConfirmedMessage("John Doe")).thenReturn("Khách hàng John Doe đã xác nhận nhận xe");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.VEHICLE_PICKUP_CONFIRMED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyVehiclePickupConfirmed("user-123", "booking-123", "John Doe");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyVehicleReturnConfirmed_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.createMessageJson(NotificationMapper.VEHICLE_RETURN_CONFIRMED_MSG, "/profile/booking-history"))
                .thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.VEHICLE_RETURN_CONFIRMED)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyVehicleReturnConfirmed("user-123", "booking-123");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyUserReturnVehicle_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatUserReturnVehicleMessage("John Doe")).thenReturn("Khách hàng John Doe đã trả xe");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.USER_RETURN_VEHICLE)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyUserReturnVehicle("user-123", "booking-123", "John Doe");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    // Test financial notification methods
    @Test
    void notifyTopupSuccessful_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatTopupSuccessfulMessage(1000.0)).thenReturn("Nạp tiền 1000 VND thành công");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.TOPUP_SUCCESSFUL)).thenReturn(Notification.type.SYSTEM);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyTopupSuccessful("user-123", 1000.0);

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyWithdrawalApproved_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatWithdrawalApprovedMessage(500.0)).thenReturn("Yêu cầu rút 500 VND đã được phê duyệt");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.WITHDRAWAL_APPROVED)).thenReturn(Notification.type.SYSTEM);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyWithdrawalApproved("user-123", 500.0);

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    // Test provider notification methods
    @Test
    void notifyProviderReceivedBooking_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatProviderReceivedBookingMessage("Test Vehicle")).thenReturn("Bạn có booking mới cho xe Test Vehicle");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.PROVIDER_RECEIVED_BOOKING)).thenReturn(Notification.type.BOOKING);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyProviderReceivedBooking("user-123", "booking-123", "Test Vehicle");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    // Test system notification methods
    @Test
    void createSystemAnnouncement_Success() {
        // Arrange
        List<String> userIds = Arrays.asList("user-123", "user-456");
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(userRepository.findById("user-456")).thenReturn(Optional.of(testUser));
        when(notificationMapper.createMessageJson("System announcement", "/announcement"))
                .thenReturn("{\"message\":\"System announcement\",\"redirectUrl\":\"/announcement\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.SYSTEM_ANNOUNCEMENT)).thenReturn(Notification.type.SYSTEM);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.createSystemAnnouncement("System announcement", "/announcement", userIds);

        // Assert
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void createSystemAnnouncement_WithException_ContinuesProcessing() {
        // Arrange
        List<String> userIds = Arrays.asList("user-123", "user-456");
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(userRepository.findById("user-456")).thenThrow(new RuntimeException("User not found"));
        when(notificationMapper.createMessageJson("System announcement", "/announcement"))
                .thenReturn("{\"message\":\"System announcement\",\"redirectUrl\":\"/announcement\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.SYSTEM_ANNOUNCEMENT)).thenReturn(Notification.type.SYSTEM);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.createSystemAnnouncement("System announcement", "/announcement", userIds);

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

//    @Test
//    void createMaintenanceNotice_Success() {
//        // Arrange
//        List<User> allUsers = Arrays.asList(testUser);
//        when(userRepository.findAll()).thenReturn(allUsers);
//        when(notificationMapper.createMessageJson(anyString(), eq("/maintenance")))
//                .thenReturn("{\"message\":\"Maintenance message\",\"redirectUrl\":\"/maintenance\"}");
//        when(notificationMapper.mapToDbType(NotificationMapper.MAINTENANCE_NOTICE)).thenReturn(Notification.type.SYSTEM);
//        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
//
//        // Act
//        notificationService.createMaintenanceNotice("System maintenance", "2024-01-01 10:00");
//
//        // Assert
//        verify(notificationRepository).save(any(Notification.class));
//    }
//
//    @Test
//    void createMaintenanceNotice_WithException_ContinuesProcessing() {
//        // Arrange
//        List<User> allUsers = Arrays.asList(testUser);
//        when(userRepository.findAll()).thenReturn(allUsers);
//        when(notificationMapper.createMessageJson(anyString(), eq("/maintenance")))
//                .thenThrow(new RuntimeException("JSON error"));
//        when(notificationMapper.mapToDbType(NotificationMapper.MAINTENANCE_NOTICE)).thenReturn(Notification.type.SYSTEM);
//
//        // Act
//        notificationService.createMaintenanceNotice("System maintenance", "2024-01-01 10:00");
//
//        // Assert
//        verify(notificationRepository, never()).save(any(Notification.class));
//    }

    // Test vehicle approval notification methods
    @Test
    void notifyVehicleApproved_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatVehicleApprovedMessage("Test Vehicle")).thenReturn("Xe \"Test Vehicle\" của bạn đã được duyệt.");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.VEHICLE_APPROVED)).thenReturn(Notification.type.SYSTEM);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyVehicleApproved("user-123", "Test Vehicle");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void notifyVehicleRejected_Success() {
        // Arrange
        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
        when(notificationMapper.formatVehicleRejectedMessage("Test Vehicle", "Invalid documents")).thenReturn("Xe \"Test Vehicle\" không được duyệt. Lý do: Invalid documents");
        when(notificationMapper.createMessageJson(anyString(), anyString())).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
        when(notificationMapper.mapToDbType(NotificationMapper.VEHICLE_REJECTED)).thenReturn(Notification.type.SYSTEM);
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        notificationService.notifyVehicleRejected("user-123", "Test Vehicle", "Invalid documents");

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    // Test edge cases and error scenarios
//    @Test
//    void updateNotification_PartialUpdate_Success() {
//        // Arrange
//        NotificationUpdateDTO partialUpdate = NotificationUpdateDTO.builder()
//                .isRead(true)
//                .build();
//        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
//        when(notificationMapper.parseMessageContent(anyString())).thenReturn(NotificationMessageContent.builder()
//                .message("Test message")
//                .redirectUrl("/test")
//                .build());
//        when(notificationMapper.createMessageJson("Test message", "/test")).thenReturn("{\"message\":\"Test message\",\"redirectUrl\":\"/test\"}");
//        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
//        when(notificationMapper.toResponseDTO(testNotification)).thenReturn(NotificationResponseDTO.builder()
//                .id("notification-123")
//                .type("BOOKING")
//                .build());
//
//        // Act
//        NotificationResponseDTO result = notificationService.updateNotification("notification-123", partialUpdate);
//
//        // Assert
//        assertThat(result).isNotNull();
//        assertThat(testNotification.getIsRead()).isTrue();
//    }
//
//    @Test
//    void createNotificationForUser_Exception_ThrowsException() {
//        // Arrange
//        when(userRepository.findById("user-123")).thenReturn(Optional.of(testUser));
//        when(notificationMapper.createMessageJson(anyString(), anyString())).thenThrow(new RuntimeException("JSON error"));
//        when(notificationMapper.mapToDbType(anyString())).thenReturn(Notification.type.BOOKING);
//
//        // Act & Assert
//        assertThatThrownBy(() -> notificationService.notifyOrderPlaced("user-123", "booking-123", "Test Vehicle"))
//                .isInstanceOf(RuntimeException.class)
//                .hasMessageContaining("JSON error");
//    }

    @Test
    void markAsRead_AlreadyRead_DoesNotUpdate() {
        // Arrange
        testNotification.setIsRead(true);
        when(notificationRepository.findById("notification-123")).thenReturn(Optional.of(testNotification));
        when(notificationMapper.toResponseDTO(testNotification)).thenReturn(NotificationResponseDTO.builder()
                .id("notification-123")
                .type("BOOKING")
                .build());

        // Act
        NotificationResponseDTO result = notificationService.markAsRead("notification-123");

        // Assert
        assertThat(result).isNotNull();
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
