import { atom } from "recoil";
import { NotificationItem } from "@/apis/notification.api";

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isDropdownOpen: boolean;
  selectedModalNotification: NotificationItem | null;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
}

export const notificationState = atom<NotificationState>({
  key: "notificationState",
  default: {
    notifications: [],
    unreadCount: 0,
    isDropdownOpen: false,
    selectedModalNotification: null,
    page: 0,
    hasMore: true,
    isLoading: false,
  },
});

// Selector để lấy thông báo chưa đọc
export const unreadNotificationsSelector = atom({
  key: "unreadNotificationsSelector",
  default: [] as NotificationItem[],
});
