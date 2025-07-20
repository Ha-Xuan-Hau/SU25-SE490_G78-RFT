package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.Notification.*;
import com.rft.rft_be.entity.Notification;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationMapper {

    private final ObjectMapper objectMapper;

    // Application notification types - map về database ENUM
    public static final String ORDER_PLACED = "ORDER_PLACED";
    public static final String ORDER_APPROVED = "ORDER_APPROVED";
    public static final String ORDER_REJECTED = "ORDER_REJECTED";
    public static final String ORDER_CANCELED = "ORDER_CANCELED";
    public static final String PAYMENT_COMPLETED = "PAYMENT_COMPLETED";
    public static final String TOPUP_SUCCESSFUL = "TOPUP_SUCCESSFUL";
    public static final String WITHDRAWAL_APPROVED = "WITHDRAWAL_APPROVED";
    public static final String VEHICLE_HANDOVER = "VEHICLE_HANDOVER";
    public static final String VEHICLE_PICKUP_CONFIRMED = "VEHICLE_PICKUP_CONFIRMED";
    public static final String VEHICLE_RETURN_CONFIRMED = "VEHICLE_RETURN_CONFIRMED";
    public static final String USER_RETURN_VEHICLE = "USER_RETURN_VEHICLE";
    public static final String PROVIDER_RECEIVED_BOOKING = "PROVIDER_RECEIVED_BOOKING";
    public static final String SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT";
    public static final String MAINTENANCE_NOTICE = "MAINTENANCE_NOTICE";

    // Message templates
    public static final String ORDER_PLACED_MSG = "Đơn hàng của bạn cho xe %s đã được đặt thành công";
    public static final String PAYMENT_COMPLETED_MSG = "Thanh toán %.0f VND cho đơn hàng đã hoàn thành";
    public static final String ORDER_APPROVED_MSG = "Đơn hàng của bạn đã được phê duyệt";
    public static final String ORDER_REJECTED_MSG = "Đơn hàng của bạn đã bị từ chối. Lý do: %s";
    public static final String ORDER_CANCELED_MSG = "Đơn hàng đã bị hủy. Lý do: %s";
    public static final String VEHICLE_HANDOVER_MSG = "Xe %s đã sẵn sàng để bàn giao tại %s";
    public static final String VEHICLE_PICKUP_CONFIRMED_MSG = "Khách hàng %s đã xác nhận nhận xe";
    public static final String VEHICLE_RETURN_CONFIRMED_MSG = "Chủ xe đã xác nhận việc trả xe của bạn";
    public static final String USER_RETURN_VEHICLE_MSG = "Khách hàng %s đã trả xe";
    public static final String TOPUP_SUCCESSFUL_MSG = "Nạp tiền %.0f VND thành công";
    public static final String WITHDRAWAL_APPROVED_MSG = "Yêu cầu rút %.0f VND đã được phê duyệt";
    public static final String PROVIDER_RECEIVED_BOOKING_MSG = "Bạn có booking mới cho xe %s";

    // Notification categories for grouping
    public static final String CATEGORY_BOOKING = "BOOKING";
    public static final String CATEGORY_PAYMENT = "PAYMENT";
    public static final String CATEGORY_VEHICLE = "VEHICLE";
    public static final String CATEGORY_SYSTEM = "SYSTEM";

    // Mapping methods
    public NotificationResponseDTO toResponseDTO(Notification notification) {
        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .type(notification.getType().name()) // Convert enum to string
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .isDeleted(notification.getIsDeleted())
                .receiverId(notification.getReceiver().getId())
                .receiverName(notification.getReceiver().getFullName())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }

    public NotificationDetailDTO toDetailDTO(Notification notification) {
        NotificationMessageContent content = parseMessageContent(notification.getMessage());

        return NotificationDetailDTO.builder()
                .id(notification.getId())
                .type(notification.getType().name()) // Convert enum to string
                .message(content.getMessage())
                .redirectUrl(content.getRedirectUrl())
                .isRead(notification.getIsRead())
                .isDeleted(notification.getIsDeleted())
                .receiverId(notification.getReceiver().getId())
                .receiverName(notification.getReceiver().getFullName())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }

    // JSON handling methods
    public String createMessageJson(String message, String redirectUrl) {
        NotificationMessageContent messageContent = NotificationMessageContent.builder()
                .message(message)
                .redirectUrl(redirectUrl)
                .build();

        try {
            return objectMapper.writeValueAsString(messageContent);
        } catch (JsonProcessingException e) {
            log.error("Error converting message to JSON", e);
            throw new RuntimeException("Error processing notification message");
        }
    }

    public NotificationMessageContent parseMessageContent(String messageJson) {
        if (messageJson == null || messageJson.trim().isEmpty()) {
            return NotificationMessageContent.builder()
                    .message("")
                    .redirectUrl(null)
                    .build();
        }

        // Kiểm tra xem có phải JSON không
        String trimmed = messageJson.trim();
        if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) {
            // Nếu không phải JSON, coi như plain text message
            log.debug("Message is not JSON format, treating as plain text: {}", messageJson);
            return NotificationMessageContent.builder()
                    .message(messageJson)
                    .redirectUrl(null)
                    .build();
        }

        try {
            return objectMapper.readValue(messageJson, NotificationMessageContent.class);
        } catch (JsonProcessingException e) {
            log.warn("Error parsing message JSON, treating as plain text: {}", messageJson);
            // Fallback: return plain text message
            return NotificationMessageContent.builder()
                    .message(messageJson)
                    .redirectUrl(null)
                    .build();
        }
    }

    // Map application notification types to database ENUM values
    public Notification.type mapToDbType(String applicationType) {
        if (applicationType == null) {
            return Notification.type.SYSTEM;
        }

        switch (applicationType) {
            // Booking related notifications
            case ORDER_PLACED:
            case ORDER_APPROVED:
            case ORDER_REJECTED:
            case ORDER_CANCELED:
            case PAYMENT_COMPLETED:
            case VEHICLE_HANDOVER:
            case VEHICLE_PICKUP_CONFIRMED:
            case VEHICLE_RETURN_CONFIRMED:
            case USER_RETURN_VEHICLE:
            case PROVIDER_RECEIVED_BOOKING:
                return Notification.type.BOOKING;

            // System notifications
            case SYSTEM_ANNOUNCEMENT:
            case MAINTENANCE_NOTICE:
            case TOPUP_SUCCESSFUL:
            case WITHDRAWAL_APPROVED:
                return Notification.type.SYSTEM;

            // Report notifications (if any)
            default:
                log.warn("Unknown notification type: {}, defaulting to SYSTEM", applicationType);
                return Notification.type.SYSTEM;
        }
    }

    // Message template methods
    public String formatOrderPlacedMessage(String vehicleName) {
        return String.format(ORDER_PLACED_MSG, vehicleName);
    }

    public String formatPaymentCompletedMessage(Double amount) {
        return String.format(PAYMENT_COMPLETED_MSG, amount);
    }

    public String formatOrderRejectedMessage(String reason) {
        return String.format(ORDER_REJECTED_MSG, reason);
    }

    public String formatOrderCanceledMessage(String reason) {
        return String.format(ORDER_CANCELED_MSG, reason);
    }

    public String formatVehicleHandoverMessage(String vehicleName, String location) {
        return String.format(VEHICLE_HANDOVER_MSG, vehicleName, location);
    }

    public String formatVehiclePickupConfirmedMessage(String renterName) {
        return String.format(VEHICLE_PICKUP_CONFIRMED_MSG, renterName);
    }

    public String formatUserReturnVehicleMessage(String renterName) {
        return String.format(USER_RETURN_VEHICLE_MSG, renterName);
    }

    public String formatTopupSuccessfulMessage(Double amount) {
        return String.format(TOPUP_SUCCESSFUL_MSG, amount);
    }

    public String formatWithdrawalApprovedMessage(Double amount) {
        return String.format(WITHDRAWAL_APPROVED_MSG, amount);
    }

    public String formatProviderReceivedBookingMessage(String vehicleName) {
        return String.format(PROVIDER_RECEIVED_BOOKING_MSG, vehicleName);
    }

    // Utility methods for notification type validation
    public boolean isValidNotificationType(String type) {
        return ORDER_PLACED.equals(type) || ORDER_APPROVED.equals(type) ||
                ORDER_REJECTED.equals(type) || ORDER_CANCELED.equals(type) ||
                PAYMENT_COMPLETED.equals(type) || TOPUP_SUCCESSFUL.equals(type) ||
                WITHDRAWAL_APPROVED.equals(type) || VEHICLE_HANDOVER.equals(type) ||
                VEHICLE_PICKUP_CONFIRMED.equals(type) || VEHICLE_RETURN_CONFIRMED.equals(type) ||
                USER_RETURN_VEHICLE.equals(type) || PROVIDER_RECEIVED_BOOKING.equals(type) ||
                SYSTEM_ANNOUNCEMENT.equals(type) || MAINTENANCE_NOTICE.equals(type);
    }

    public String getNotificationCategory(String type) {
        if (ORDER_PLACED.equals(type) || ORDER_APPROVED.equals(type) ||
                ORDER_REJECTED.equals(type) || ORDER_CANCELED.equals(type)) {
            return CATEGORY_BOOKING;
        } else if (PAYMENT_COMPLETED.equals(type) || TOPUP_SUCCESSFUL.equals(type) ||
                WITHDRAWAL_APPROVED.equals(type)) {
            return CATEGORY_PAYMENT;
        } else if (VEHICLE_HANDOVER.equals(type) || VEHICLE_PICKUP_CONFIRMED.equals(type) ||
                VEHICLE_RETURN_CONFIRMED.equals(type) || USER_RETURN_VEHICLE.equals(type)) {
            return CATEGORY_VEHICLE;
        } else if (SYSTEM_ANNOUNCEMENT.equals(type) || MAINTENANCE_NOTICE.equals(type)) {
            return CATEGORY_SYSTEM;
        }
        return "UNKNOWN";
    }
}
