import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import moment from "moment";
import "moment/locale/vi";
import { createPortal } from "react-dom";

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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [bellPosition, setBellPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  // Mounted effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640; // sm breakpoint
  const isTablet = windowWidth >= 640 && windowWidth < 1024; // sm to lg
  const isDesktop = windowWidth >= 1024; // lg and up

  // Get bell position for desktop dropdown
  useEffect(() => {
    if (isDropdownOpen && isDesktop) {
      // Tìm tất cả các bell elements (desktop và mobile)
      const bellElements = document.querySelectorAll(
        '[class*="hover:bg-gray-100"][class*="rounded-lg"]'
      );

      // Tìm bell element cho desktop (trong hidden lg:flex container)
      let desktopBell = null;
      bellElements.forEach((el) => {
        const parent = el.closest(".hidden.lg\\:flex");
        if (parent) {
          desktopBell = el;
        }
      });

      if (desktopBell) {
        const rect = (desktopBell as Element).getBoundingClientRect();
        setBellPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isDropdownOpen, isDesktop]);

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDropdownOpen) return;

      const target = event.target as Node;

      // Kiểm tra nếu click vào bell button
      const clickedOnBell = (target as Element).closest(
        '[class*="hover:bg-gray-100"][class*="rounded-lg"]'
      );
      if (clickedOnBell) return;

      // Kiểm tra nếu click ngoài dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      // Delay để tránh đóng ngay khi mở
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

  // Prevent body scroll when dropdown is open on mobile/tablet
  useEffect(() => {
    if (isDropdownOpen && !isDesktop) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isDropdownOpen, isDesktop]);

  // Helper functions
  const parseDateTime = (date: string | number[]) => {
    if (Array.isArray(date)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = date;
      return moment({ year, month: month - 1, day, hour, minute, second });
    }
    return moment(date);
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
      await clickNotification(notification.id);

      if (notification.redirectUrl) {
        closeDropdown();
        router.push(notification.redirectUrl);
      } else {
        openModal({
          ...notification,
          message: notification.message,
        });
      }
    } catch (error) {
      console.error("Error clicking notification:", error);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (!isDropdownOpen || !mounted) return null;

  // Notification List Component (reusable)
  const NotificationList = () => (
    <>
      {isLoading ? (
        <div className="p-8 text-center">
          <Icon
            icon="heroicons:arrow-path-20-solid"
            className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500"
          />
          <p className="text-sm text-gray-500">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Icon
            icon="heroicons:bell-slash-20-solid"
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
          />
          <p className="text-lg font-medium mb-2 text-gray-600">
            Chưa có thông báo
          </p>
          <p className="text-sm text-gray-500">
            Thông báo mới sẽ xuất hiện ở đây
          </p>
        </div>
      ) : (
        <>
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                ${isDesktop ? "p-4" : "p-3 sm:p-4"} 
                cursor-pointer transition-all hover:bg-gray-50
                ${
                  !notification.isRead
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }
                ${
                  index !== notifications.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }
              `}
            >
              <div
                className={`flex items-start ${
                  isDesktop ? "space-x-3" : "gap-2 sm:gap-3"
                }`}
              >
                <div
                  className={`${getNotificationColor(notification.type)} ${
                    isDesktop ? "p-2" : "p-1.5 sm:p-2"
                  } rounded-full bg-white shadow-sm flex-shrink-0`}
                >
                  <Icon
                    icon={getNotificationIcon(notification.type)}
                    className={isDesktop ? "w-5 h-5" : "w-4 sm:w-5 h-4 sm:h-5"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`${
                      isDesktop ? "text-sm" : "text-xs sm:text-sm"
                    } leading-5 ${
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
                  <div
                    className={`${
                      isDesktop
                        ? "w-2 h-2 mt-2"
                        : "w-1.5 sm:w-2 h-1.5 sm:h-2 mt-1 sm:mt-2"
                    } bg-blue-500 rounded-full flex-shrink-0`}
                  ></div>
                )}
                {notification.redirectUrl && (
                  <Icon
                    icon={
                      isDesktop
                        ? "heroicons:arrow-top-right-on-square-20-solid"
                        : "heroicons:chevron-right-20-solid"
                    }
                    className={`w-4 h-4 text-gray-400 ${
                      isDesktop ? "" : "mt-1"
                    } flex-shrink-0`}
                  />
                )}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="p-4 text-center bg-gray-50">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 transition-colors px-4 py-2 rounded-full hover:bg-blue-100"
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
    </>
  );

  // Mobile & Tablet View - Full Screen Modal
  if (!isDesktop) {
    return createPortal(
      <>
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: 99998 }}
          onClick={closeDropdown}
        />

        {/* Modal Content */}
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`
            fixed 
            ${
              isMobile
                ? "inset-4"
                : "inset-8 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] sm:h-[600px]"
            }
            bg-white rounded-2xl shadow-2xl flex flex-col
          `}
          style={{ zIndex: 99999 }}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl flex-shrink-0">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                {unreadCount > 0 ? `${unreadCount} thông báo mới` : "Thông báo"}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs sm:text-sm text-blue-600 font-medium px-2 sm:px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <span className="hidden sm:inline">
                      Đánh dấu hết đã đọc
                    </span>
                    <span className="sm:hidden">Đọc hết</span>
                  </button>
                )}
                <button
                  onClick={closeDropdown}
                  className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Icon icon="heroicons:x-mark-20-solid" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            <NotificationList />
          </div>
        </motion.div>
      </>,
      document.body
    );
  }

  // Desktop View - Dropdown
  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed w-96 bg-white rounded-xl shadow-lg overflow-hidden"
        style={{
          top: `${bellPosition.top}px`,
          right: `${bellPosition.right}px`,
          maxHeight: "480px",
          zIndex: 99999,
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
          <NotificationList />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default NotificationDropdown;
