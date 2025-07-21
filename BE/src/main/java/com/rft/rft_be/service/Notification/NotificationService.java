package com.rft.rft_be.service.Notification;

import com.rft.rft_be.dto.Notification.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {

    // Basic CRUD operations
    /**
     * Tạo thông báo mới cho user
     * Input: NotificationCreateDTO (receiverId, type, message, redirectUrl)
     * Công dụng: Tạo thông báo tùy chỉnh cho user cụ thể
     */
    NotificationResponseDTO createNotification(NotificationCreateDTO request);
    
    /**
     * Cập nhật thông báo đã tồn tại
     * Input: notificationId + NotificationUpdateDTO (type, message, redirectUrl, isRead, isDeleted)
     * Công dụng: Sửa đổi nội dung hoặc trạng thái thông báo
     */
    NotificationResponseDTO updateNotification(String notificationId, NotificationUpdateDTO request);
    
    /**
     * Xóa thông báo (soft delete)
     * Input: notificationId
     * Công dụng: Đánh dấu thông báo là đã xóa
     */
    void deleteNotification(String notificationId);

    // Read operations
    /**
     * Lấy danh sách thông báo của user với phân trang
     * Input: userId + pageable
     * Công dụng: Hiển thị danh sách thông báo cho user
     */
    Page<NotificationDetailDTO> getNotificationsByUser(String userId, Pageable pageable);
    
    /**
     * Lấy thông báo chưa đọc của user
     * Input: userId
     * Công dụng: Hiển thị thông báo chưa đọc để user xem
     */
    List<NotificationDetailDTO> getUnreadNotifications(String userId);
    
    /**
     * Đếm số thông báo chưa đọc
     * Input: userId
     * Công dụng: Hiển thị badge số thông báo chưa đọc trên UI
     */
    Long getUnreadCount(String userId);
    
    /**
     * Lấy tất cả thông báo (cho admin)
     * Input: pageable
     * Công dụng: Admin xem tất cả thông báo trong hệ thống
     */
    Page<NotificationDetailDTO> getAllNotifications(Pageable pageable);

    // Mark as read operations
    /**
     * Đánh dấu đã đọc và trả về URL redirect
     * Input: notificationId
     * Công dụng: Khi user click vào thông báo, đánh dấu đã đọc và chuyển hướng
     */
    NotificationDetailDTO markAsReadAndGetRedirectUrl(String notificationId);
    
    /**
     * Đánh dấu thông báo đã đọc
     * Input: notificationId
     * Công dụng: Cập nhật trạng thái đã đọc cho thông báo
     */
    NotificationResponseDTO markAsRead(String notificationId);
    
    /**
     * Đánh dấu tất cả thông báo đã đọc
     * Input: userId
     * Công dụng: User có thể đánh dấu tất cả thông báo đã đọc cùng lúc
     */
    void markAllAsRead(String userId);

    // Booking workflow notifications
    /**
     * Thông báo đặt xe thành công
     * Input: userId, bookingId, vehicleName
     * Công dụng: Thông báo cho user biết đã đặt xe thành công
     */
    void notifyOrderPlaced(String userId, String bookingId, String vehicleName);
    
    /**
     * Thông báo thanh toán hoàn tất
     * Input: userId, bookingId, amount
     * Công dụng: Thông báo cho user biết đã thanh toán thành công
     */
    void notifyPaymentCompleted(String userId, String bookingId, Double amount);
    
    /**
     * Thông báo đơn hàng được duyệt
     * Input: userId, bookingId
     * Công dụng: Thông báo cho user biết đơn hàng đã được chủ xe duyệt
     */
    void notifyOrderApproved(String userId, String bookingId);
    
    /**
     * Thông báo đơn hàng bị từ chối
     * Input: userId, bookingId, reason
     * Công dụng: Thông báo cho user biết đơn hàng bị từ chối và lý do
     */
    void notifyOrderRejected(String userId, String bookingId, String reason);
    
    /**
     * Thông báo đơn hàng bị hủy
     * Input: userId, bookingId, reason
     * Công dụng: Thông báo cho user biết đơn hàng bị hủy và lý do
     */
    void notifyOrderCanceled(String userId, String bookingId, String reason);
    void notifyBookingCompleted(String userId, String bookingId);


    // Vehicle handover notifications
    /**
     * Thông báo giao xe
     * Input: userId, bookingId, vehicleName, location
     * Công dụng: Thông báo cho user biết xe đã sẵn sàng giao tại địa điểm
     */
    void notifyVehicleHandover(String userId, String bookingId, String vehicleName, String location);
    
    /**
     * Thông báo xác nhận nhận xe
     * Input: ownerId, bookingId, renterName
     * Công dụng: Thông báo cho chủ xe biết người thuê đã nhận xe
     */
    void notifyVehiclePickupConfirmed(String ownerId, String bookingId, String renterName);
    
    /**
     * Thông báo xác nhận trả xe
     * Input: userId, bookingId
     * Công dụng: Thông báo cho user biết xe đã được trả thành công
     */
    void notifyVehicleReturnConfirmed(String userId, String bookingId);
    
    /**
     * Thông báo user trả xe
     * Input: ownerId, bookingId, renterName
     * Công dụng: Thông báo cho chủ xe biết người thuê đã trả xe
     */
    void notifyUserReturnVehicle(String ownerId, String bookingId, String renterName);

    // Financial notifications
    /**
     * Thông báo nạp tiền thành công
     * Input: userId, amount
     * Công dụng: Thông báo cho user biết đã nạp tiền thành công vào ví
     */
    void notifyTopupSuccessful(String userId, Double amount);
    
    /**
     * Thông báo rút tiền được duyệt
     * Input: userId, amount
     * Công dụng: Thông báo cho user biết yêu cầu rút tiền đã được duyệt
     */
    void notifyWithdrawalApproved(String userId, Double amount);

    // Provider notifications
    /**
     * Thông báo chủ xe nhận được đơn đặt xe
     * Input: providerId, bookingId, vehicleName
     * Công dụng: Thông báo cho chủ xe biết có đơn đặt xe mới
     */
    void notifyProviderReceivedBooking(String providerId, String bookingId, String vehicleName);

    // System notifications
    /**
     * Tạo thông báo hệ thống cho nhiều user
     * Input: message, redirectUrl, userIds
     * Công dụng: Admin gửi thông báo chung cho nhiều user (thông báo mới, cập nhật app...)
     */
    void createSystemAnnouncement(String message, String redirectUrl, List<String> userIds);
    
    /**
     * Tạo thông báo bảo trì hệ thống
     * Input: message, scheduledTime
     * Công dụng: Thông báo cho tất cả user biết hệ thống sẽ bảo trì
     */
    void createMaintenanceNotice(String message, String scheduledTime);

    void notifyVehicleApproved(String userId, String vehicleName); // thông báo tới provider sau khi admin duyệt xe của họ
    void notifyVehicleRejected(String userId, String vehicleName, String reason); // thông báo tới provider sau khi admin từ chối xe của họ kèm lí do
}