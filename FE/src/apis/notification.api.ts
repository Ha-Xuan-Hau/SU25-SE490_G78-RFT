import { apiClient } from "./client";

export interface NotificationItem {
  id: string;
  type: string;
  message: string; // Đã là string, không phải JSON
  redirectUrl: string | null; // Có thể null
  isRead: boolean;
  isDeleted: boolean;
  receiverId: string;
  receiverName: string;
  createdAt: number[] | string; // Có thể là array hoặc string
  updatedAt: number[] | string;
}

export interface NotificationResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const notificationApi = {
  // Lấy danh sách thông báo với phân trang
  getMyNotifications: (page = 0, size = 5) =>
    apiClient.get<NotificationResponse>("/notifications/my", {
      params: { page, size, sortBy: "createdAt", sortDir: "desc" },
    }),

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: () =>
    apiClient.get<{ unreadCount: number }>("/notifications/my/unread/count"),

  // Lấy thông báo chưa đọc
  getUnreadNotifications: () =>
    apiClient.get<NotificationItem[]>("/notifications/my/unread"),

  // Click thông báo (mark as read + get redirect URL)
  clickNotification: (id: string) =>
    apiClient.post<NotificationItem>(`/notifications/${id}/click`),

  // Đánh dấu thông báo đã đọc
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: () => apiClient.put("/notifications/my/read-all"),
};
