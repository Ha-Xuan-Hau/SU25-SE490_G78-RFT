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

export const ProviderLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [providerProfile, , clearProviderProfile] = useLocalStorage(
    "user_profile",
    ""
  );

  // Track screen size for mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== "undefined") {
      // Set initial value
      setIsMobile(window.innerWidth < 768);

      // Add event listener
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      };

      // Add event listener
      window.addEventListener("resize", handleResize);

      // Call handler right away so state gets updated with initial window size
      handleResize();

      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // User authentication storage hooks
  useLocalStorage("access_token");
  useLocalStorage("user_profile", "");

  const menuGroups = [
    {
      title: "Thông tin cá nhân",
      items: [
        {
          key: "dashboard",
          path: "/provider/dashboard",
          icon: "mdi:view-dashboard",
          label: "Thống kê",
        },
        {
          key: "profile",
          path: "/provider/provider-profile",
          icon: "mdi:account",
          label: "Thông tin cá nhân",
        },
        {
          key: "provider-wallet",
          path: "/provider/provider-wallet",
          icon: "mdi:wallet",
          label: "Ví của tôi",
        },
        {
          key: "change-password",
          path: "/provider/change-password",
          icon: "mdi:key",
          label: "Đổi mật khẩu",
        },
      ],
    },
    {
      title: "Quản lý thuê xe",
      items: [
        {
          key: "bookings",
          path: "/provider/manage-bookings",
          icon: "mdi:calendar-clock",
          label: "Đơn đặt thuê xe",
        },
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
      ],
    },
    {
      title: "Quản lý xe",
      items: [
        {
          key: "vehicles",
          path: "/provider/manage-vehicles",
          icon: "mdi:car",
          label: "Xe của tôi",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderComponent />
      {/* Full-width layout, sát màn hình */}
      <section className="flex-1 w-full bg-white dark:bg-gray-900 py-0">
        <div className="flex min-h-screen w-full relative">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-20 left-4 z-30 bg-primary text-white p-2 rounded-md shadow-md"
          >
            {sidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>

          {/* Sidebar - responsive */}
          <div
            className={`${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            } fixed md:relative top-0 left-0 h-full z-20 md:z-0 ${
              isMobile ? "bg-white" : "bg-transparent"
            } 
            w-64  px-4 py-2 flex-shrink-0
            transform transition-transform duration-300 ease-in-out md:translate-x-0
            shadow-lg md:shadow-none`}
          >
            <div className="px-4 py-6 border-b ">
              <div className="flex flex-col items-center">
                <h3 className="text-base font-semibold mt-2 text-gray-800 dark:text-white truncate w-full text-center">
                  {providerProfile?.fullName || "Người dùng"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                  {providerProfile?.email || "user@example.com"}
                </p>
              </div>
            </div>
            <nav className="mt-16 md:mt-6">
              {menuGroups.map((group) => (
                <div key={group.title} className="mb-8">
                  <div className="font-bold text-gray-600 mb-2 px-2">
                    {group.title}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.path}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            currentPath === item.path
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <Icon
                            icon={item.icon}
                            className="w-5 h-5 flex-shrink-0"
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Backdrop for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-10 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          {/* Main content - takes all remaining space */}
          <div className="flex-1 px-2 md:px-6 py-4 w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6 h-full overflow-x-auto">
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
