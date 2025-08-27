// hooks/useRealtimeEvents.ts
import { useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRecoilState } from "recoil";
import { notificationState } from "@/recoils/notificationState";
import RealtimeEventService, {
  EventType,
  RealtimeEvent,
} from "@/services/RealtimeEventService";
import { useRouter } from "next/router";

interface UseRealtimeEventsOptions {
  onNotification?: (notification: any) => void;
  onDataUpdate?: (data: any) => void;
  onStatusChange?: (status: any) => void;
  autoInvalidateQueries?: boolean;
}

export const useRealtimeEvents = (options: UseRealtimeEventsOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [, setNotificationState] = useRecoilState(notificationState);

  // ✅ THÊM: Handler cho admin reload events (phải khai báo TRƯỚC handleEvent)
  const handleAdminReloadEvent = useCallback((event: RealtimeEvent) => {
    const isAdmin = user?.role === "ADMIN" || user?.role === "STAFF";

    if (!isAdmin) {
      console.log("User is not admin, ignoring admin event");
      return;
    }

    console.log("🎯 Processing admin reload event:", event.eventType);
    console.log("Current path:", router.pathname);

    let shouldRefresh = false;
    let pageName = "";

    switch (event.eventType) {
      case "ADMIN_RELOAD_DASHBOARD":
        if (router.pathname === "/admin/dashboard" ||
            router.pathname === "/admin" ||
            router.pathname.includes("dashboard")) {
          shouldRefresh = true;
          pageName = "Dashboard";
        }
        break;

      case "ADMIN_RELOAD_VEHICLES_PENDING":
        if (router.pathname.includes("manage-vehicles-pending") ||
            router.pathname.includes("vehicles-pending")) {
          shouldRefresh = true;
          pageName = "Xe chờ duyệt";
        }
        break;

      case "ADMIN_RELOAD_WITHDRAWAL_REQUESTS":
        if (router.pathname.includes("manage-withdrawal-request") ||
            router.pathname.includes("withdrawal-request")) {
          shouldRefresh = true;
          pageName = "Yêu cầu rút tiền";
        }
        break;

      case "ADMIN_RELOAD_REPORTS":
        if (router.pathname.includes("manage-report") ||
            router.pathname.includes("report")) {
          shouldRefresh = true;
          pageName = "Báo cáo";
        }
        break;

      case "ADMIN_RELOAD_REPORT_DETAIL":
        if (router.pathname === "/report-detail") {
          // Check nếu reportId match (nếu có gửi kèm)
          const currentReportId = router.query.reportId;
          const eventReportId = event.payload?.reportId;

          // Reload nếu không có reportId hoặc reportId match
          if (!eventReportId || currentReportId === eventReportId) {
            shouldRefresh = true;
            pageName = "Chi tiết báo cáo";
          }
        }
        break;

      case "ADMIN_RELOAD_ALL":
        if (router.pathname.startsWith("/admin")) {
          shouldRefresh = true;
          pageName = "Trang quản trị";
        }
        break;
    }

    if (shouldRefresh) {
      if (router.pathname === "/report-detail") {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // Các trang khác dùng custom event
        const refreshEvent = new CustomEvent('admin-data-refresh', {
          detail: { eventType: event.eventType, pageName }
        });
        window.dispatchEvent(refreshEvent);
      }
    }
  }, [user?.role, router.pathname, router.query]);

  const handleEvent = useCallback(
      (event: RealtimeEvent) => {
        console.log("Received event:", event);

        // Xử lý Admin Reload Events
        if (event.eventType.startsWith("ADMIN_RELOAD")) {
          console.log("🔄 Admin reload event detected:", event.eventType);
          handleAdminReloadEvent(event);
          return;
        }

        if (options.autoInvalidateQueries !== false) {
          switch (event.eventType) {
            case "BOOKING_UPDATE":
            case "BOOKING_STATUS_CHANGE":
              queryClient.invalidateQueries({ queryKey: ["bookings"] });
              if (event.payload?.bookingId) {
                queryClient.invalidateQueries({
                  queryKey: ["booking", event.payload.bookingId],
                });
              }
              break;

            case "PAYMENT_UPDATE":
            case "WALLET_UPDATE":
              queryClient.invalidateQueries({ queryKey: ["wallet"] });
              queryClient.invalidateQueries({ queryKey: ["payments"] });
              break;

            case "VEHICLE_UPDATE":
              queryClient.invalidateQueries({ queryKey: ["vehicles"] });
              if (event.payload?.vehicleId) {
                queryClient.invalidateQueries({
                  queryKey: ["vehicle", event.payload.vehicleId],
                });
              }
              break;

            case "NOTIFICATION":
              console.log("📬 Processing NOTIFICATION event:", event.payload);

              setNotificationState((prev) => {
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
                  ),
                  unreadCount: newUnreadCount,
                };
              });

              queryClient.cancelQueries({
                queryKey: ["notifications", "unread-count"],
              });

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

              setTimeout(() => {
                queryClient.refetchQueries({
                  queryKey: ["notifications", "unread-count"],
                  type: "active",
                });
              }, 100);

              queryClient.invalidateQueries({
                queryKey: ["notifications", "list"],
              });
              queryClient.invalidateQueries({
                queryKey: ["notifications", "unread-count"],
                refetchType: "all",
              });

              if (options.onNotification) {
                options.onNotification(event.payload);
              }
              break;

            case "NOTIFICATION_READ":
              console.log(
                  "📬 Processing NOTIFICATION_READ event:",
                  event.payload
              );

              setNotificationState((prev) => {
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

              queryClient.cancelQueries({
                queryKey: ["notifications", "unread-count"],
              });

              queryClient.setQueryData(
                  ["notifications", "unread-count"],
                  (oldData: any) => ({
                    ...oldData,
                    unreadCount: Math.max(0, (oldData?.unreadCount || 1) - 1),
                  })
              );

              setTimeout(() => {
                queryClient.refetchQueries({
                  queryKey: ["notifications", "unread-count"],
                  type: "active",
                });
              }, 100);

              queryClient.invalidateQueries({
                queryKey: ["notifications", "unread-count"],
              });
              break;

            case "NOTIFICATION_ALL_READ":
              console.log("📬 Processing NOTIFICATION_ALL_READ event");

              setNotificationState((prev) => ({
                ...prev,
                notifications: prev.notifications.map((notif) => ({
                  ...notif,
                  isRead: true,
                })),
                unreadCount: 0,
              }));

              queryClient.cancelQueries({
                queryKey: ["notifications", "unread-count"],
              });

              queryClient.setQueryData(
                  ["notifications", "unread-count"],
                  (oldData: any) => ({
                    ...oldData,
                    unreadCount: 0,
                  })
              );

              setTimeout(() => {
                queryClient.refetchQueries({
                  queryKey: ["notifications"],
                  type: "active",
                });
              }, 100);

              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              break;

            case "DATA_UPDATE":
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
              if (options.onStatusChange) {
                options.onStatusChange(event.payload);
              }
              break;

            case "SYSTEM_ALERT":
              break;
          }
        }
      },
      [queryClient, options, setNotificationState, handleAdminReloadEvent] // ✅ THÊM handleAdminReloadEvent vào dependencies
  );

  // ✅ THÊM: Subscribe to admin channel if user is admin
  useEffect(() => {
    if (!user?.id) return;

    const isAdmin = user.role === "ADMIN" || user.role === "STAFF";

    if (isAdmin) {
      console.log("👤 Admin user detected, subscribing to admin channel...");

      const checkAndSubscribe = setInterval(() => {
        if (RealtimeEventService.isConnected()) {
          clearInterval(checkAndSubscribe);

          const unsubscribe = RealtimeEventService.subscribeToChannel("admin", (event) => {
            console.log("📢 [Admin Channel] Event received:", event);
            handleEvent(event);
          });

          console.log("✅ Subscribed to admin channel");

          (window as any).__adminChannelUnsub = unsubscribe;
        }
      }, 1000);

      return () => {
        clearInterval(checkAndSubscribe);
        if ((window as any).__adminChannelUnsub) {
          (window as any).__adminChannelUnsub();
        }
      };
    }
  }, [user?.id, user?.role, handleEvent]);

  // Effect connect WebSocket
  useEffect(() => {
    if (!user?.id) return;

    console.log("🔌 Connecting WebSocket for user:", user.id, "Role:", user.role);

    RealtimeEventService.connect(user.id)
        .then(() => {
          console.log("✅ WebSocket connected successfully");
        })
        .catch(console.error);

    const unsubscribe = RealtimeEventService.onAny(handleEvent);

    return () => {
      unsubscribe();
    };
  }, [user?.id, handleEvent]);

  return {
    on: RealtimeEventService.on.bind(RealtimeEventService),
    subscribeToChannel:
        RealtimeEventService.subscribeToChannel.bind(RealtimeEventService),
    isConnected: RealtimeEventService.isConnected.bind(RealtimeEventService),
  };
};
