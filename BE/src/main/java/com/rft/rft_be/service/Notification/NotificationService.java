package com.rft.rft_be.service.Notification;

import com.rft.rft_be.dto.Notification.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {

    // Basic CRUD operations
    NotificationResponseDTO createNotification(NotificationCreateDTO request);
    NotificationResponseDTO updateNotification(String notificationId, NotificationUpdateDTO request);
    void deleteNotification(String notificationId);

    // Read operations
    Page<NotificationDetailDTO> getNotificationsByUser(String userId, Pageable pageable);
    List<NotificationDetailDTO> getUnreadNotifications(String userId);
    Long getUnreadCount(String userId);
    Page<NotificationDetailDTO> getAllNotifications(Pageable pageable);

    // Mark as read operations
    NotificationDetailDTO markAsReadAndGetRedirectUrl(String notificationId);
    NotificationResponseDTO markAsRead(String notificationId);
    void markAllAsRead(String userId);

    // Booking workflow notifications
    void notifyOrderPlaced(String userId, String bookingId, String vehicleName);
    void notifyPaymentCompleted(String userId, String bookingId, Double amount);
    void notifyOrderApproved(String userId, String bookingId);
    void notifyOrderRejected(String userId, String bookingId, String reason);
    void notifyOrderCanceled(String userId, String bookingId, String reason);
    void notifyBookingCompleted(String userId, String bookingId);


    // Vehicle handover notifications
    void notifyVehicleHandover(String userId, String bookingId, String vehicleName, String location);
    void notifyVehiclePickupConfirmed(String ownerId, String bookingId, String renterName);
    void notifyVehicleReturnConfirmed(String userId, String bookingId);
    void notifyUserReturnVehicle(String ownerId, String bookingId, String renterName);

    // Financial notifications
    void notifyTopupSuccessful(String userId, Double amount);
    void notifyWithdrawalApproved(String userId, Double amount);

    // Provider notifications
    void notifyProviderReceivedBooking(String providerId, String bookingId, String vehicleName);

    // System notifications
    void createSystemAnnouncement(String message, String redirectUrl, List<String> userIds);
    void createMaintenanceNotice(String message, String scheduledTime);
}