"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import HeaderComponent from "@/components/HeaderComponent";
import FooterComponent from "@/components/FooterComponent";
import { Icon } from "@iconify/react";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Tooltip } from "antd";

export const ProviderLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false); // THAY ĐỔI: false mặc định
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [providerProfile, , clearProviderProfile] = useLocalStorage(
    "user_profile",
    ""
  );

  // User authentication storage hooks
  useLocalStorage("access_token");
  useLocalStorage("user_profile", "");

  // Check role authorization - GIỮ NGUYÊN
  useEffect(() => {
    const checkAuthorization = () => {
      setTimeout(() => {
        const storedUser = localStorage.getItem("user_profile");

        if (!storedUser) {
          router.push("/");
          return;
        }

        try {
          const user = JSON.parse(storedUser);

          if (user.role === "PROVIDER") {
            setIsAuthorized(true);
          } else {
            router.push("/not-found");
          }
        } catch (error) {
          console.error("Error parsing user profile:", error);
          router.push("/not-found");
        } finally {
          setIsLoading(false);
        }
      }, 100);
    };

    checkAuthorization();
  }, [router]);

  // THÊM MỚI: Lắng nghe event từ header để toggle sidebar
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen((prev) => !prev);
    };

    window.addEventListener("toggleDesktopMenu", handleToggleSidebar);

    return () => {
      window.removeEventListener("toggleDesktopMenu", handleToggleSidebar);
    };
  }, []);

  // Auto close sidebar khi navigate
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  // SỬA LẠI: Không tự động mở sidebar trên desktop
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        // Chỉ đóng sidebar khi resize xuống mobile
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        }
        // XÓA phần else setSidebarOpen(true)
      };

      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Show loading while checking authorization - GIỮ NGUYÊN
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // menuGroups - GIỮ NGUYÊN
  const menuGroups = [
    {
      title: "Thông tin cá nhân",
      items: [
        {
          key: "dashboard",
          path: "/provider/dashboard",
          icon: "mdi:view-dashboard",
          label: "Bảng điều khiển",
        },
        {
          key: "provider-wallet",
          path: "/provider/provider-wallet",
          icon: "mdi:wallet",
          label: "Ví của tôi",
        },
      ],
    },
    {
      title: "Quản lý thuê xe",
      items: [
        {
          key: "orders",
          path: "/provider/manage-accepted-bookings",
          icon: "mdi:calendar-check",
          label: "Quản lý đơn hàng",
        },
        {
          key: "contracts",
          path: "/provider/manage-contracts",
          icon: "mdi:file-document",
          label: "Hợp đồng thuê xe",
        },
        {
          key: "final-contracts",
          path: "/provider/manage-penalties",
          icon: "mdi:pencil-box-multiple",
          label: "Quy định thuê xe",
        },
        {
          key: "reports",
          path: "/profile/my-reports",
          icon: "mdi:chart-box",
          label: "Lịch sử vi phạm",
        },
      ],
    },
    {
      title: "Quản lý xe",
      items: [
        {
          key: "vehicles",
          path: "/provider/manage-vehicles",
          icon: "mdi:car-multiple",
          label: "Xe của tôi",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderComponent />

      <section className="flex-1 w-full">
        <div className="flex min-h-screen w-full relative">
          {/* Icon Sidebar - Chỉ hiển thị trên desktop */}
          <div className="hidden md:block fixed top-0 left-0 h-full w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 pt-4">
            {/* Toggle button ở đầu sidebar */}
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-4"
              title="Menu"
            >
              <MenuOutlined className="text-gray-600 dark:text-gray-300 text-lg" />
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 mb-4" />

            {/* Icon navigation */}
            <nav className="space-y-1">
              {menuGroups.map((group, groupIndex) => (
                <div key={group.title} className="mb-2">
                  {group.items.map((item) => (
                    <Tooltip
                      key={item.key}
                      title={item.label}
                      placement="right"
                    >
                      <Link
                        href={item.path}
                        className={`flex items-center justify-center p-3 mx-2 mb-1 rounded-lg transition-all duration-200 ${
                          currentPath === item.path
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <Icon
                          icon={item.icon}
                          className={`w-5 h-5 ${
                            currentPath === item.path
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-400"
                          }`}
                        />
                      </Link>
                    </Tooltip>
                  ))}
                  {groupIndex < menuGroups.length - 1 && (
                    <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 my-2" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Full Sidebar - Logic giữ nguyên hoàn toàn */}
          <div
            className={`${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } fixed top-0 left-0 h-full z-40
          w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          shadow-xl overflow-y-auto`}
          >
            {/* Nút close trong sidebar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon
                  icon="heroicons:x-mark-20-solid"
                  className="w-5 h-5 text-gray-700 dark:text-gray-300"
                />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate w-full">
                  {providerProfile?.fullName || "Người dùng"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full">
                  {providerProfile?.email || "user@example.com"}
                </p>
                <span className="inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Chủ xe
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="mt-4 pb-6">
              {menuGroups.map((group) => (
                <div key={group.title} className="mb-6">
                  <div className="px-6 py-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {group.title}
                    </h4>
                  </div>
                  <ul className="space-y-1 px-3">
                    {group.items.map((item) => (
                      <li key={`${item.key}-${item.path}`}>
                        <Link
                          href={item.path}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                            currentPath === item.path
                              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-r-2 border-green-600"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon
                            icon={item.icon}
                            className={`w-5 h-5 flex-shrink-0 transition-colors ${
                              currentPath === item.path
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                            }`}
                          />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Backdrop - hiển thị cho cả desktop và mobile khi sidebar mở */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={toggleSidebar}
            />
          )}

          {/* Main content - Thêm margin-left cho desktop khi có icon sidebar */}
          <div className="flex-1 px-4 md:px-6 py-6 w-full md:ml-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full overflow-x-auto">
              {children}
            </div>
          </div>
        </div>
      </section>

      <FooterComponent />
    </div>
  );
};

export default ProviderLayout;
