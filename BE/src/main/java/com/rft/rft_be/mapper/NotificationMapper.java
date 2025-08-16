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
    public static final String VEHICLE_APPROVED = "VEHICLE_APPROVED";
    public static final String VEHICLE_REJECTED = "VEHICLE_REJECTED";
    public static final String REFUND_AFTER_CANCELLATION = "REFUND_AFTER_CANCELLATION";
    public static final String PENALTY_RECEIVED_AFTER_CANCELLATION = "PENALTY_RECEIVED_AFTER_CANCELLATION";


    // Message templates
    public static final String ORDER_PLACED_MSG = "Đơn hàng của bạn cho xe %s đã được đặt thành công";
    public static final String PAYMENT_COMPLETED_MSG = "Thanh toán %.0f VND cho đơn hàng đã hoàn thành";
    public static final String ORDER_APPROVED_MSG = "Đơn hàng của bạn đã được phê duyệt";
    public static final String ORDER_REJECTED_MSG = "Đơn hàng của bạn đã bị từ chối. Lý do: %s";
 //   public static final String ORDER_CANCELED_MSG = "Đơn hàng đã bị hủy. Lý do: %s";
    public static final String VEHICLE_HANDOVER_MSG = "Xe %s đã sẵn sàng để bàn giao tại %s";
    public static final String VEHICLE_PICKUP_CONFIRMED_MSG = "Khách hàng %s đã xác nhận nhận xe";
    public static final String VEHICLE_RETURN_CONFIRMED_MSG = "Chủ xe đã xác nhận việc trả xe của bạn";
    public static final String USER_RETURN_VEHICLE_MSG = "Khách hàng %s đã trả xe";
    public static final String TOPUP_SUCCESSFUL_MSG = "Nạp tiền %.0f VND thành công";
    public static final String WITHDRAWAL_APPROVED_MSG = "Yêu cầu rút %.0f VND đã được phê duyệt";
    public static final String PROVIDER_RECEIVED_BOOKING_MSG = "Bạn có booking mới cho xe %s";
    public static final String BOOKING_COMPLETED = "BOOKING_COMPLETED";
    public static final String BOOKING_COMPLETED_MSG = "Đơn hàng của bạn đã được hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ!";
    public static final String VEHICLE_APPROVED_MSG = "Xe \"%s\" của bạn đã được duyệt.";
    public static final String VEHICLE_REJECTED_MSG = "Xe \"%s\" không được duyệt. Lý do: %s";
    public static final String REFUND_AFTER_CANCELLATION_MSG = "Bạn đã được hoàn lại %.0f VND từ đơn hàng #%s sau khi hủy. Vui lòng kiểm tra ví.";
    public static final String PENALTY_RECEIVED_AFTER_CANCELLATION_MSG = "Bạn đã nhận được %.0f VND phí phạt từ đơn hàng #%s. Vui lòng kiểm tra ví.";
    public static final String WARNING_TWO_FLAGS_MSG = "Cảnh báo: Tài khoản bị báo cáo 2 lần. Kiểm tra email để biết thông tin chi tiết";
    public static final String ACCOUNT_TEMPORARY_BAN_MSG = "Tài khoản bị báo cáo 3 lần và bị ban. Kiểm tra email để biết chi tiết!";
    public static final String ACCOUNT_BEING_STAFF_REPORTED = "Bạn đã bị báo cáo vi phạm và có 24 giờ để gửi khiếu nại. Yêu cầu đọc ngay";
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

    public String formatRefundAfterCancellationMessage(Double amount, String bookingId) {
        return String.format(REFUND_AFTER_CANCELLATION_MSG, amount, bookingId);
    }

    public String formatPenaltyReceivedAfterCancellationMessage(Double amount, String bookingId) {
        return String.format(PENALTY_RECEIVED_AFTER_CANCELLATION_MSG, amount, bookingId);
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
            case BOOKING_COMPLETED:
                return Notification.type.BOOKING;
            case VEHICLE_APPROVED:
            case VEHICLE_REJECTED:
                return Notification.type.SYSTEM;

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
        if (reason == null || reason.trim().isEmpty()) {
            return "Đơn hàng đã bị hủy.";
        }
        return "Đơn hàng đã bị hủy do: " + reason;
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

    public String formatVehicleApprovedMessage(String vehicleName) {
        return String.format(VEHICLE_APPROVED_MSG, vehicleName);
    }

    public String formatVehicleRejectedMessage(String vehicleName, String reason) {
        return String.format(VEHICLE_REJECTED_MSG, vehicleName, reason);
    }

    public NotificationCreateDTO toNotificationCreateDTO(String receiverId, String type, String message, String redirectUrl) {
        return NotificationCreateDTO.builder()
                .receiverId(receiverId)
                .type(type)
                .message(message)
                .redirectUrl(redirectUrl)
                .build();
    }

    // Utility methods for notification type validation
    public boolean isValidNotificationType(String type) {
        return ORDER_PLACED.equals(type) || ORDER_APPROVED.equals(type) ||
                ORDER_REJECTED.equals(type) || ORDER_CANCELED.equals(type) ||
                PAYMENT_COMPLETED.equals(type) || TOPUP_SUCCESSFUL.equals(type) ||
                WITHDRAWAL_APPROVED.equals(type) || VEHICLE_HANDOVER.equals(type) ||
                VEHICLE_PICKUP_CONFIRMED.equals(type) || VEHICLE_RETURN_CONFIRMED.equals(type) ||
                USER_RETURN_VEHICLE.equals(type) || PROVIDER_RECEIVED_BOOKING.equals(type) ||
                VEHICLE_APPROVED.equals(type) || VEHICLE_REJECTED.equals(type) ||
                SYSTEM_ANNOUNCEMENT.equals(type) || MAINTENANCE_NOTICE.equals(type) || BOOKING_COMPLETED.equals(type);
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
        else if (BOOKING_COMPLETED.equals(type)) {
            return CATEGORY_BOOKING;
        }
        else if (VEHICLE_APPROVED.equals(type) || VEHICLE_REJECTED.equals(type)) {
            return CATEGORY_VEHICLE;
        }
        return "UNKNOWN";
    }
}
