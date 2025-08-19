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
            // Sửa lại cách gọi invalidateQueries
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
            // Update notification state
            setNotificationState((prev) => ({
              ...prev,
              notifications: [event.payload, ...prev.notifications],
              unreadCount: prev.unreadCount + 1,
            }));

            queryClient.invalidateQueries({ queryKey: ["notifications"] });

            if (options.onNotification) {
              options.onNotification(event.payload);
            }

            // if (event.payload?.message) {
            //     toast.info(event.payload.message);
            // }
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
            // toast.warning(event.payload?.message || "System alert", {
            //   autoClose: false,
            // });
            break;
        }
      }
    },
    [queryClient, options, setNotificationState]
  );

  useEffect(() => {
    if (!user?.id) return;

    RealtimeEventService.connect(user.id).catch(console.error);

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
