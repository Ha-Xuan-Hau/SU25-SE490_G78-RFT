import React, { useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import moment from "moment";
import "moment/locale/vi";

moment.locale("vi");

const NotificationDropdown: React.FC = () => {
  const {
    isDropdownOpen,
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    clickNotification,
    markAllAsRead,
    closeDropdown,
    loadMore,
    openModal,
  } = useNotifications();

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

  // Helper function để convert array time thành moment object
  const parseDateTime = (date: string | number[]) => {
    if (Array.isArray(date)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = date;
      return moment({ year, month: month - 1, day, hour, minute, second });
    }
    return moment(date); // string hoặc số timestamp
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      BOOKING: "heroicons:calendar-days-20-solid",
      ORDER_PLACED: "heroicons:shopping-cart-20-solid",
      ORDER_APPROVED: "heroicons:check-circle-20-solid",
      ORDER_REJECTED: "heroicons:x-circle-20-solid",
      PAYMENT_COMPLETED: "heroicons:credit-card-20-solid",
      VEHICLE_HANDOVER: "heroicons:key-20-solid",
      TOPUP_SUCCESSFUL: "heroicons:banknotes-20-solid",
      SYSTEM_ANNOUNCEMENT: "heroicons:megaphone-20-solid",
      MAINTENANCE_NOTICE: "heroicons:wrench-screwdriver-20-solid",
      VEHICLE_PICKUP_CONFIRMED: "heroicons:check-badge-20-solid",
      VEHICLE_RETURN_CONFIRMED: "heroicons:arrow-uturn-left-20-solid",
      BOOKING_COMPLETED: "heroicons:flag-20-solid",
      VEHICLE_APPROVED: "heroicons:shield-check-20-solid",
      VEHICLE_REJECTED: "heroicons:shield-exclamation-20-solid",
      REPORT: "heroicons:flag-20-solid",
    };
    return iconMap[type as keyof typeof iconMap] || "heroicons:bell-20-solid";
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      BOOKING: "text-blue-600",
      ORDER_PLACED: "text-blue-600",
      ORDER_APPROVED: "text-green-600",
      ORDER_REJECTED: "text-red-600",
      PAYMENT_COMPLETED: "text-purple-600",
      VEHICLE_HANDOVER: "text-yellow-600",
      TOPUP_SUCCESSFUL: "text-green-600",
      SYSTEM_ANNOUNCEMENT: "text-orange-600",
      MAINTENANCE_NOTICE: "text-gray-600",
      VEHICLE_PICKUP_CONFIRMED: "text-green-600",
      VEHICLE_RETURN_CONFIRMED: "text-blue-600",
      BOOKING_COMPLETED: "text-purple-600",
      VEHICLE_APPROVED: "text-green-600",
      VEHICLE_REJECTED: "text-red-600",
      REPORT: "text-orange-600",
    };
    return colorMap[type as keyof typeof colorMap] || "text-gray-600";
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      console.log("Clicked notification:", notification); // Debug log

      // Click notification để mark as read trước
      await clickNotification(notification.id);

      // Kiểm tra redirectUrl trực tiếp từ notification object
      if (notification.redirectUrl) {
        console.log("Redirecting to:", notification.redirectUrl); // Debug log
        closeDropdown();

        // Chuyển hướng với router.push
        router.push(notification.redirectUrl);
      } else {
        console.log("Opening modal for notification without URL"); // Debug log
        // Không có URL -> mở modal
        openModal({
          ...notification,
          message: notification.message, // Message đã là string rồi
        });
      }
    } catch (error) {
      console.error("Error clicking notification:", error);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (!isDropdownOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        // initial={{ opacity: 0, y: -10, scale: 0.95 }}
        // animate={{ opacity: 1, y: 0, scale: 1 }}
        // exit={{ opacity: 0, y: -10, scale: 0.95 }}
        // transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg overflow-hidden z-50"
        style={{
          maxHeight: "480px",
          boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              {unreadCount > 0
                ? `Bạn có ${unreadCount} thông báo mới`
                : "Thông báo"}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-1 rounded-full hover:bg-blue-100"
              >
                Đánh dấu hết đã đọc
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <Icon
                icon="heroicons:arrow-path-20-solid"
                className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500"
              />
              <p className="text-sm">Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Icon
                icon="heroicons:bell-slash-20-solid"
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
              />
              <p className="text-lg font-medium mb-2 text-gray-600">
                Chưa có thông báo
              </p>
              <p className="text-sm text-gray-500">
                Các thông báo mới sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => {
                return (
                  <motion.div
                    key={notification.id}
                    // initial={{ opacity: 0, x: -20 }}
                    // animate={{ opacity: 1, x: 0 }}
                    // transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.isRead
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    } ${
                      index !== notifications.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`${getNotificationColor(
                          notification.type
                        )} flex-shrink-0 p-2 rounded-full bg-white shadow-sm`}
                      >
                        <Icon
                          icon={getNotificationIcon(notification.type)}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-5 ${
                            !notification.isRead
                              ? "font-medium text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <Icon
                            icon="heroicons:clock-20-solid"
                            className="w-3 h-3 mr-1"
                          />
                          {parseDateTime(notification.createdAt).fromNow()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                      {/* Hiển thị icon redirect nếu có URL */}
                      {notification.redirectUrl && (
                        <div className="flex-shrink-0 text-gray-400">
                          <Icon
                            icon="heroicons:arrow-top-right-on-square-20-solid"
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center bg-gray-50">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-full hover:bg-blue-100"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Icon
                          icon="heroicons:arrow-path-20-solid"
                          className="w-4 h-4 animate-spin"
                        />
                        Đang tải...
                      </div>
                    ) : (
                      "Tải thêm thông báo"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDropdown;
