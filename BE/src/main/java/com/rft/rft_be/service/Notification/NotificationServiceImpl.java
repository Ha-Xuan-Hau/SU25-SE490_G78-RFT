package com.rft.rft_be.service.Notification;

import com.rft.rft_be.dto.Notification.*;
import com.rft.rft_be.entity.Notification;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.repository.NotificationRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.Notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public NotificationResponseDTO createNotification(NotificationCreateDTO request) {
        log.info("Creating notification for user: {}", request.getReceiverId());

        // Validate notification type
        if (!notificationMapper.isValidNotificationType(request.getType())) {
            throw new RuntimeException("Invalid notification type: " + request.getType());
        }

        User receiver = findUserById(request.getReceiverId());
        String messageJson = notificationMapper.createMessageJson(request.getMessage(), request.getRedirectUrl());

        // Map application type to database ENUM
        Notification.type dbType = notificationMapper.mapToDbType(request.getType());

        Notification notification = buildNotification(dbType, messageJson, receiver);
        Notification savedNotification = notificationRepository.save(notification);

        log.info("Notification created successfully with id: {} and db type: {}",
                savedNotification.getId(), dbType);
        return notificationMapper.toResponseDTO(savedNotification);
    }

    @Override
    @Transactional
    public NotificationResponseDTO updateNotification(String notificationId, NotificationUpdateDTO request) {
        log.info("Updating notification: {}", notificationId);

        Notification notification = findNotificationById(notificationId);

        if (request.getType() != null) {
            if (!notificationMapper.isValidNotificationType(request.getType())) {
                throw new RuntimeException("Invalid notification type: " + request.getType());
            }
            // Map to database ENUM
            Notification.type dbType = notificationMapper.mapToDbType(request.getType());
            notification.setType(dbType);
        }

        if (request.getMessage() != null || request.getRedirectUrl() != null) {
            String currentMessage = request.getMessage() != null ? request.getMessage() :
                    notificationMapper.parseMessageContent(notification.getMessage()).getMessage();
            String currentUrl = request.getRedirectUrl() != null ? request.getRedirectUrl() :
                    notificationMapper.parseMessageContent(notification.getMessage()).getRedirectUrl();

            String messageJson = notificationMapper.createMessageJson(currentMessage, currentUrl);
            notification.setMessage(messageJson);
        }

        if (request.getIsRead() != null) {
            notification.setIsRead(request.getIsRead());
        }

        if (request.getIsDeleted() != null) {
            notification.setIsDeleted(request.getIsDeleted());
        }

        Notification updatedNotification = notificationRepository.save(notification);

        log.info("Notification {} updated successfully", notificationId);
        return notificationMapper.toResponseDTO(updatedNotification);
    }

    @Override
    @Transactional
    public void deleteNotification(String notificationId) {
        log.info("Deleting notification: {}", notificationId);

        Notification notification = findNotificationById(notificationId);
        notification.setIsDeleted(true);
        notificationRepository.save(notification);

        log.info("Notification {} deleted successfully", notificationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDetailDTO> getNotificationsByUser(String userId, Pageable pageable) {
        log.debug("Getting notifications for user: {}", userId);
        Page<Notification> notifications = notificationRepository.findByReceiverIdAndNotDeleted(userId, pageable);
        return notifications.map(notificationMapper::toDetailDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDetailDTO> getUnreadNotifications(String userId) {
        log.debug("Getting unread notifications for user: {}", userId);
        List<Notification> notifications = notificationRepository.findUnreadByReceiverId(userId);
        return notifications.stream().map(notificationMapper::toDetailDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(String userId) {
        return notificationRepository.countUnreadByReceiverId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDetailDTO> getAllNotifications(Pageable pageable) {
        log.debug("Getting all notifications with pagination");
        Page<Notification> notifications = notificationRepository.findAll(pageable);
        return notifications.map(notificationMapper::toDetailDTO);
    }

    @Override
    @Transactional
    public NotificationDetailDTO markAsReadAndGetRedirectUrl(String notificationId) {
        log.info("Marking notification as read: {}", notificationId);

        Notification notification = findNotificationById(notificationId);

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification = notificationRepository.save(notification);
        }

        return notificationMapper.toDetailDTO(notification);
    }

    @Override
    @Transactional
    public NotificationResponseDTO markAsRead(String notificationId) {
        Notification notification = findNotificationById(notificationId);

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification = notificationRepository.save(notification);
        }

        return notificationMapper.toResponseDTO(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String userId) {
        log.info("Marking all notifications as read for user: {}", userId);

        List<Notification> unreadNotifications = notificationRepository.findUnreadByReceiverId(userId);
        if (!unreadNotifications.isEmpty()) {
            unreadNotifications.forEach(notification -> {
                notification.setIsRead(true);
            });
            notificationRepository.saveAll(unreadNotifications);
            log.info("Marked {} notifications as read for user: {}", unreadNotifications.size(), userId);
        }
    }

    // Booking workflow notifications

    @Override
    @Transactional
    public void notifyOrderPlaced(String userId, String bookingId, String vehicleName) {
        String message = notificationMapper.formatOrderPlacedMessage(vehicleName);
        String redirectUrl = "/booking-detail/" + bookingId;
        createNotificationForUser(userId, NotificationMapper.ORDER_PLACED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyPaymentCompleted(String userId, String bookingId, Double amount) {
        String message = notificationMapper.formatPaymentCompletedMessage(amount);
//        String redirectUrl = "/bookings/" + bookingId + "/payment";
        String redirectUrl = "/booking-detail/" + bookingId;

        createNotificationForUser(userId, NotificationMapper.PAYMENT_COMPLETED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyOrderApproved(String userId, String bookingId) {
    //    String redirectUrl = "/booking-detail/" + bookingId;
        String redirectUrl = "/booking-history";
        createNotificationForUser(userId, NotificationMapper.ORDER_APPROVED, NotificationMapper.ORDER_APPROVED_MSG, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyOrderRejected(String userId, String bookingId, String reason) {
        String message = notificationMapper.formatOrderRejectedMessage(reason);
        String redirectUrl = "/booking-detail/" + bookingId;
        createNotificationForUser(userId, NotificationMapper.ORDER_REJECTED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyOrderCanceled(String userId, String bookingId, String reason) {
        String message = notificationMapper.formatOrderCanceledMessage(reason);
        String redirectUrl = "/booking-detail/" + bookingId;
        createNotificationForUser(userId, NotificationMapper.ORDER_CANCELED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyVehicleHandover(String userId, String bookingId, String vehicleName, String location) {
        String message = notificationMapper.formatVehicleHandoverMessage(vehicleName, location);
//        String redirectUrl = "/bookings/" + bookingId + "/handover";
        String redirectUrl = "/booking-history";
        createNotificationForUser(userId, NotificationMapper.VEHICLE_HANDOVER, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyVehiclePickupConfirmed(String ownerId, String bookingId, String renterName) {
        String message = notificationMapper.formatVehiclePickupConfirmedMessage(renterName);
    //    String redirectUrl = "/bookings/" + bookingId;
        String redirectUrl = "/provider/manage-accepted-bookings";
        createNotificationForUser(ownerId, NotificationMapper.VEHICLE_PICKUP_CONFIRMED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyVehicleReturnConfirmed(String userId, String bookingId) {
        String redirectUrl = "/booking-history";
        createNotificationForUser(userId, NotificationMapper.VEHICLE_RETURN_CONFIRMED, NotificationMapper.VEHICLE_RETURN_CONFIRMED_MSG, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyUserReturnVehicle(String ownerId, String bookingId, String renterName) {
        String message = notificationMapper.formatUserReturnVehicleMessage(renterName);
        String redirectUrl = "/provider/manage-accepted-bookings";
        createNotificationForUser(ownerId, NotificationMapper.USER_RETURN_VEHICLE, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyTopupSuccessful(String userId, Double amount) {
        String message = notificationMapper.formatTopupSuccessfulMessage(amount);
        String redirectUrl = "/wallet";
        createNotificationForUser(userId, NotificationMapper.TOPUP_SUCCESSFUL, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyWithdrawalApproved(String userId, Double amount) {
        String message = notificationMapper.formatWithdrawalApprovedMessage(amount);
        String redirectUrl = "/wallet/transactions";
        createNotificationForUser(userId, NotificationMapper.WITHDRAWAL_APPROVED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyProviderReceivedBooking(String providerId, String bookingId, String vehicleName) {
        String message = notificationMapper.formatProviderReceivedBookingMessage(vehicleName);
        String redirectUrl = "/provider/manage-bookings";
        createNotificationForUser(providerId, NotificationMapper.PROVIDER_RECEIVED_BOOKING, message, redirectUrl);
    }

    @Override
    @Transactional
    public void createSystemAnnouncement(String message, String redirectUrl, List<String> userIds) {
        log.info("Creating system announcement for {} users", userIds.size());

        int successCount = 0;
        int failCount = 0;

        for (String userId : userIds) {
            try {
                createNotificationForUser(userId, NotificationMapper.SYSTEM_ANNOUNCEMENT, message, redirectUrl);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to create notification for user: {}", userId, e);
                failCount++;
            }
        }

        log.info("System announcement completed: {} success, {} failed", successCount, failCount);
    }

    @Override
    @Transactional
    public void createMaintenanceNotice(String message, String scheduledTime) {
        String fullMessage = String.format("Hệ thống sẽ bảo trì vào %s. %s", scheduledTime, message);

        List<User> allUsers = userRepository.findAll();
        log.info("Creating maintenance notice for {} users", allUsers.size());

        int successCount = 0;
        int failCount = 0;

        for (User user : allUsers) {
            try {
                createNotificationForUser(user.getId(), NotificationMapper.MAINTENANCE_NOTICE,
                        fullMessage, "/maintenance");
                successCount++;
            } catch (Exception e) {
                log.error("Failed to create maintenance notice for user: {}", user.getId(), e);
                failCount++;
            }
        }

        log.info("Maintenance notice completed: {} success, {} failed", successCount, failCount);
    }

    // Helper methods

    private void createNotificationForUser(String userId, String applicationType, String message, String redirectUrl) {
        try {
            User user = findUserById(userId);
            String messageJson = notificationMapper.createMessageJson(message, redirectUrl);

            // Map application type to database ENUM
            Notification.type dbType = notificationMapper.mapToDbType(applicationType);

            Notification notification = buildNotification(dbType, messageJson, user);
            notificationRepository.save(notification);

            log.debug("Created {} notification (db type: {}) for user: {}",
                    applicationType, dbType, userId);
        } catch (Exception e) {
            log.error("Failed to create notification for user: {}", userId, e);
            throw e;
        }
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    private Notification findNotificationById(String notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
    }

    private Notification buildNotification(Notification.type dbType, String messageJson, User receiver) {
        return Notification.builder()
                .type(dbType) // Sử dụng inner enum
                .message(messageJson)
                .isRead(false)
                .isDeleted(false)
                .receiver(receiver)
                .build();
    }
    @Override
    @Transactional
    public void notifyBookingCompleted(String userId, String bookingId) {
        String message = NotificationMapper.BOOKING_COMPLETED_MSG;
        String redirectUrl = "/booking-detail/" + bookingId;
        createNotificationForUser(userId, NotificationMapper.BOOKING_COMPLETED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyVehicleApproved(String userId, String vehicleName) {
        String message = notificationMapper.formatVehicleApprovedMessage(vehicleName);
        String redirectUrl = "/provider/manage-vehicles";
        createNotificationForUser(userId, NotificationMapper.VEHICLE_APPROVED, message, redirectUrl);
    }

    @Override
    @Transactional
    public void notifyVehicleRejected(String userId, String vehicleName, String reason) {
        String message = notificationMapper.formatVehicleRejectedMessage(vehicleName, reason);
        String redirectUrl = "/provider/manage-vehicles";
        createNotificationForUser(userId, NotificationMapper.VEHICLE_REJECTED, message, redirectUrl);
    }
}
