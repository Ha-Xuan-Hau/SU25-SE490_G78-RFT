import { useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRecoilState } from "recoil";
import { notificationState } from "@/recoils/notificationState";
import RealtimeEventService, {
  EventType,
  RealtimeEvent,
} from "@/services/RealtimeEventService";
import { toast } from "react-toastify";

interface UseRealtimeEventsOptions {
  onNotification?: (notification: any) => void;
  onDataUpdate?: (data: any) => void;
  onStatusChange?: (status: any) => void;
  autoInvalidateQueries?: boolean;
}

export const useRealtimeEvents = (options: UseRealtimeEventsOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setNotificationState] = useRecoilState(notificationState);

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      console.log("Received event:", event);

      if (options.autoInvalidateQueries !== false) {
        switch (event.eventType) {
          case "BOOKING_UPDATE":
          case "BOOKING_STATUS_CHANGE":
            // GIỮ NGUYÊN LOGIC CŨ
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            if (event.payload?.bookingId) {
              queryClient.invalidateQueries({
                queryKey: ["booking", event.payload.bookingId],
              });
            }
            break;

          case "PAYMENT_UPDATE":
          case "WALLET_UPDATE":
            // GIỮ NGUYÊN LOGIC CŨ
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            break;

          case "VEHICLE_UPDATE":
            // GIỮ NGUYÊN LOGIC CŨ
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            if (event.payload?.vehicleId) {
              queryClient.invalidateQueries({
                queryKey: ["vehicle", event.payload.vehicleId],
              });
            }
            break;

          case "NOTIFICATION":
            console.log("📬 Processing NOTIFICATION event:", event.payload);

            // GIỮ NGUYÊN: Update notification state với notification mới
            setNotificationState((prev) => {
              // GIỮ NGUYÊN: Kiểm tra xem notification đã tồn tại chưa
              const exists = prev.notifications.some(
                (n) => n.id === event.payload.id
              );
              if (exists) return prev;

              const newUnreadCount =
                prev.unreadCount + (event.payload.isRead ? 0 : 1);
              console.log("New unread count:", newUnreadCount);

              return {
                ...prev,
                notifications: [event.payload, ...prev.notifications].slice(
                  0,
                  20
                ), // GIỮ NGUYÊN: Giới hạn 20 items
                unreadCount: newUnreadCount,
              };
            });

            // THÊM MỚI: Cancel các queries đang pending
            queryClient.cancelQueries({
              queryKey: ["notifications", "unread-count"],
            });

            // THÊM MỚI: Set data trực tiếp vào React Query cache
            queryClient.setQueryData(
              ["notifications", "unread-count"],
              (oldData: any) => {
                const currentCount = oldData?.unreadCount || 0;
                return {
                  ...oldData,
                  unreadCount: currentCount + (event.payload.isRead ? 0 : 1),
                };
              }
            );

            // THÊM MỚI: Force refetch ngay lập tức
            setTimeout(() => {
              queryClient.refetchQueries({
                queryKey: ["notifications", "unread-count"],
                type: "active",
              });
            }, 100);

            // SỬA ĐỔI: Thay đổi refetchType từ cũ sang 'all'
            queryClient.invalidateQueries({
              queryKey: ["notifications", "list"],
            });
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread-count"],
              refetchType: "all", // THAY ĐỔI: từ không có hoặc 'active' sang 'all'
            });

            // GIỮ NGUYÊN: Callback
            if (options.onNotification) {
              options.onNotification(event.payload);
            }
            break;

          case "NOTIFICATION_READ":
            console.log(
              "📬 Processing NOTIFICATION_READ event:",
              event.payload
            );

            // GIỮ NGUYÊN: Update state khi notification được đánh dấu đã đọc
            setNotificationState((prev) => {
              // THÊM MỚI: Kiểm tra notification có tồn tại và chưa đọc
              const notif = prev.notifications.find(
                (n) => n.id === event.payload.notificationId
              );

              if (!notif || notif.isRead) return prev;

              return {
                ...prev,
                notifications: prev.notifications.map((n) =>
                  n.id === event.payload.notificationId
                    ? { ...n, isRead: true }
                    : n
                ),
                unreadCount: Math.max(0, prev.unreadCount - 1),
              };
            });

            // THÊM MỚI: Cancel và update cache
            queryClient.cancelQueries({
              queryKey: ["notifications", "unread-count"],
            });

            // THÊM MỚI: Set data vào cache
            queryClient.setQueryData(
              ["notifications", "unread-count"],
              (oldData: any) => ({
                ...oldData,
                unreadCount: Math.max(0, (oldData?.unreadCount || 1) - 1),
              })
            );

            // THÊM MỚI: Force refetch
            setTimeout(() => {
              queryClient.refetchQueries({
                queryKey: ["notifications", "unread-count"],
                type: "active",
              });
            }, 100);

            // GIỮ NGUYÊN: Invalidate query cũ
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread-count"],
            });
            break;

          case "NOTIFICATION_ALL_READ":
            console.log("📬 Processing NOTIFICATION_ALL_READ event");

            // GIỮ NGUYÊN: Update state khi tất cả được đánh dấu đã đọc
            setNotificationState((prev) => ({
              ...prev,
              notifications: prev.notifications.map((notif) => ({
                ...notif,
                isRead: true,
              })),
              unreadCount: 0,
            }));

            // THÊM MỚI: Cancel và set cache
            queryClient.cancelQueries({
              queryKey: ["notifications", "unread-count"],
            });

            // THÊM MỚI: Set data vào cache
            queryClient.setQueryData(
              ["notifications", "unread-count"],
              (oldData: any) => ({
                ...oldData,
                unreadCount: 0,
              })
            );

            // THÊM MỚI: Force refetch all
            setTimeout(() => {
              queryClient.refetchQueries({
                queryKey: ["notifications"],
                type: "active",
              });
            }, 100);

            // GIỮ NGUYÊN: Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            break;

          case "DATA_UPDATE":
            // GIỮ NGUYÊN LOGIC CŨ
            if (options.onDataUpdate) {
              options.onDataUpdate(event.payload);
            }
            if (event.metadata?.dataType) {
              queryClient.invalidateQueries({
                queryKey: [event.metadata.dataType],
              });
            }
            break;

          case "STATUS_CHANGE":
            // GIỮ NGUYÊN LOGIC CŨ
            if (options.onStatusChange) {
              options.onStatusChange(event.payload);
            }
            break;

          case "SYSTEM_ALERT":
            // GIỮ NGUYÊN LOGIC CŨ (commented out)
            // toast.warning(event.payload?.message || "System alert", {
            //   autoClose: false,
            // });
            break;
        }
      }
    },
    [queryClient, options, setNotificationState]
  );

  // GIỮ NGUYÊN: Effect connect WebSocket
  useEffect(() => {
    if (!user?.id) return;

    RealtimeEventService.connect(user.id).catch(console.error);

    const unsubscribe = RealtimeEventService.onAny(handleEvent);

    return () => {
      unsubscribe();
    };
  }, [user?.id, handleEvent]);

  // GIỮ NGUYÊN: Return object
  return {
    on: RealtimeEventService.on.bind(RealtimeEventService),
    subscribeToChannel:
      RealtimeEventService.subscribeToChannel.bind(RealtimeEventService),
    isConnected: RealtimeEventService.isConnected.bind(RealtimeEventService),
  };
};
