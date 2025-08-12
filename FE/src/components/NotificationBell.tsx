import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationRefresh } from "@/hooks/useWebSocketRefresh";
import { useQueryClient } from "@tanstack/react-query";

const NotificationBell: React.FC = () => {
  const queryClient = useQueryClient();
  const { unreadCount, isDropdownOpen, toggleDropdown, forceRefresh } = useNotifications();
  
  // Initialize WebSocket refresh với custom handler
  useEffect(() => {
    const handleWebSocketUpdate = () => {
      console.log('🔔 Bell: WebSocket notification received');
      // Force refresh khi nhận WebSocket event
      forceRefresh?.();
    };

    // Listen to query invalidation events
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event?.query?.queryKey?.[0] === 'notifications') {
        console.log('🔔 Bell: Query cache updated');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, forceRefresh]);

  // Use WebSocket refresh hook
  useNotificationRefresh();

  console.log('🔔 NotificationBell render - unreadCount:', unreadCount);

  return (
    <div className="relative">
      <div onClick={toggleDropdown} className="cursor-pointer">
        <div className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Icon
            icon="heroicons:bell-20-solid"
            className={`w-6 h-6 transition-colors ${
              isDropdownOpen
                ? "text-primary"
                : "text-gray-600 hover:text-gray-800"
            }`}
          />

          {/* Badge với animation */}
          {unreadCount > 0 && (
            <div
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-sm transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
                border: "2px solid white",
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
              }}
            >
              <span className="text-white text-sm font-bold leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
