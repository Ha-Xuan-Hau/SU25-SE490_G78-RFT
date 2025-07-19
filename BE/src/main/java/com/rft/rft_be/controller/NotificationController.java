package com.rft.rft_be.controller;
import com.rft.rft_be.dto.Notification.*;
import com.rft.rft_be.service.Notification.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    // User APIs

    @GetMapping("/my")
    public ResponseEntity<Page<NotificationDetailDTO>> getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        String userId = extractUserIdFromAuth(authentication);
        log.info("Nhận thông báo cho người dùng: {} với trang: {}, kích thước: {}", userId, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<NotificationDetailDTO> notifications = notificationService.getNotificationsByUser(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/my/unread")
    public ResponseEntity<List<NotificationDetailDTO>> getUnreadNotifications(Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        log.info("Nhận thông báo chưa đọc cho người dùng: {}", userId);

        List<NotificationDetailDTO> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/my/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        log.info("Nhận số lượng chưa đọc cho người dùng: {}", userId);

        Long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/{id}/click")
    public ResponseEntity<NotificationDetailDTO> clickNotification(@PathVariable String id) {
        log.info("Thông báo đã được nhấp: {}", id);
        NotificationDetailDTO response = notificationService.markAsReadAndGetRedirectUrl(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(@PathVariable String id) {
        log.info("Đánh dấu thông báo là đã đọc: {}", id);
        NotificationResponseDTO response = notificationService.markAsRead(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/my/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        String userId = extractUserIdFromAuth(authentication);
        log.info("Marking all notifications as read for user: {}", userId);

        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "Tất cả thông báo được đánh dấu là đã đọc"));
    }

    // Admin APIs

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<NotificationDetailDTO>> getAllNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.info("Quản trị viên nhận được tất cả thông báo với trang: {}, kích thước: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<NotificationDetailDTO> notifications = notificationService.getAllNotifications(pageable);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createNotificationByAdmin(
            @Valid @RequestBody AdminNotificationCreateDTO request) {

        log.info("Quản trị viên tạo thông báo:{}", request);

        if (request.getSendToAll() != null && request.getSendToAll()) {
            // Send to all users
            notificationService.createSystemAnnouncement(
                    request.getMessage(),
                    request.getRedirectUrl(),
                    request.getReceiverIds()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Thông báo đã được gửi đến tất cả người dùng"));
        } else {
            // Send to specific users
            int successCount = 0;
            int failCount = 0;

            for (String receiverId : request.getReceiverIds()) {
                try {
                    NotificationCreateDTO createDTO = NotificationCreateDTO.builder()
                            .type(request.getType())
                            .message(request.getMessage())
                            .redirectUrl(request.getRedirectUrl())
                            .receiverId(receiverId)
                            .build();

                    notificationService.createNotification(createDTO);
                    successCount++;
                } catch (Exception e) {
                    log.error("Không tạo được thông báo cho người dùng: {}", receiverId, e);
                    failCount++;
                }
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Thông báo đã được tạo",
                    "successCount", successCount,
                    "failCount", failCount
            ));
        }
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationResponseDTO> updateNotification(
            @PathVariable String id,
            @Valid @RequestBody NotificationUpdateDTO request) {

        log.info("Admin updating notification: {} with data: {}", id, request);
        NotificationResponseDTO response = notificationService.updateNotification(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable String id) {
        log.info("Admin deleting notification: {}", id);
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("message", "Thông báo đã được xóa thành công"));
    }

    @PostMapping("/admin/system-announcement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> createSystemAnnouncement(
            @RequestBody Map<String, Object> request) {

        String message = (String) request.get("message");
        String redirectUrl = (String) request.get("redirectUrl");
        @SuppressWarnings("unchecked")
        List<String> userIds = (List<String>) request.get("userIds");

        log.info("Creating system announcement for {} users", userIds != null ? userIds.size() : 0);

        if (userIds != null && !userIds.isEmpty()) {
            notificationService.createSystemAnnouncement(message, redirectUrl, userIds);
        }

        return ResponseEntity.ok(Map.of("message", "Thông báo hệ thống đã được tạo thành công"));
    }

    @PostMapping("/admin/maintenance-notice")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> createMaintenanceNotice(
            @RequestBody Map<String, String> request) {

        String message = request.get("message");
        String scheduledTime = request.get("scheduledTime");

        log.info("Creating maintenance notice: {}", message);
        notificationService.createMaintenanceNotice(message, scheduledTime);

        return ResponseEntity.ok(Map.of("message", "Thông báo bảo trì đã được tạo thành công"));
    }

    // Booking workflow APIs (called by other services)

    @PostMapping("/booking/order-placed")
    public ResponseEntity<Map<String, String>> notifyOrderPlaced(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        String bookingId = (String) request.get("bookingId");
        String vehicleName = (String) request.get("vehicleName");

        notificationService.notifyOrderPlaced(userId, bookingId, vehicleName);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo đặt hàng"));
    }

    @PostMapping("/booking/payment-completed")
    public ResponseEntity<Map<String, String>> notifyPaymentCompleted(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        String bookingId = (String) request.get("bookingId");
        Double amount = ((Number) request.get("amount")).doubleValue();

        notificationService.notifyPaymentCompleted(userId, bookingId, amount);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo thanh toán hoàn tất"));
    }

    @PostMapping("/booking/order-approved")
    public ResponseEntity<Map<String, String>> notifyOrderApproved(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        String bookingId = (String) request.get("bookingId");

        notificationService.notifyOrderApproved(userId, bookingId);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo đơn hàng đã được chấp thuận"));
    }

    @PostMapping("/booking/order-rejected")
    public ResponseEntity<Map<String, String>> notifyOrderRejected(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        String bookingId = (String) request.get("bookingId");
        String reason = (String) request.get("reason");

        notificationService.notifyOrderRejected(userId, bookingId, reason);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo đơn hàng bị từ chối"));
    }

    @PostMapping("/booking/vehicle-handover")
    public ResponseEntity<Map<String, String>> notifyVehicleHandover(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        String bookingId = (String) request.get("bookingId");
        String vehicleName = (String) request.get("vehicleName");
        String location = (String) request.get("location");

        notificationService.notifyVehicleHandover(userId, bookingId, vehicleName, location);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo bàn giao xe"));
    }

    @PostMapping("/wallet/topup-successful")
    public ResponseEntity<Map<String, String>> notifyTopupSuccessful(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        Double amount = ((Number) request.get("amount")).doubleValue();

        notificationService.notifyTopupSuccessful(userId, amount);
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo nạp tiền thành công"));
    }

    private String extractUserIdFromAuth(Authentication authentication) {
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        return jwtAuth.getToken().getClaim("userId");
    }
}
