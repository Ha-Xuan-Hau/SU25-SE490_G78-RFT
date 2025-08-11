import React from "react";
import { Icon } from "@iconify/react";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationBell: React.FC = () => {
  const { unreadCount, isDropdownOpen, toggleDropdown } = useNotifications();

  return (
    <div className="relative">
      <div onClick={toggleDropdown} className="cursor-pointer">
        <div className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          {/* Bell Icon */}
          <Icon
            icon="heroicons:bell-20-solid"
            className={`w-6 h-6 transition-colors ${
              isDropdownOpen
                ? "text-primary"
                : "text-gray-600 hover:text-gray-800"
            }`}
          />

          {/* Badge giống thiết kế */}
          {unreadCount > 0 && (
            <div
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-sm"
              style={{
                background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
                border: "2px solid white",
              }}
            >
              <span className="text-white text-sm font-bold leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;
