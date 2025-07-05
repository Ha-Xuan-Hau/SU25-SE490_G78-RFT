"use client";

import type React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import HeaderComponent from "@/components/HeaderComponent";
import FooterComponent from "@/components/FooterComponent";
import { Icon } from "@iconify/react";
import useLocalStorage from "@/hooks/useLocalStorage";

export const ProviderLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  const [accessToken, setAccessToken, clearAccessToken] =
    useLocalStorage("access_token");

  const [userProfile, setUserProfile, clearUserProfile] = useLocalStorage(
    "user_profile",
    ""
  );

  const menuItems = [
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
      key: "vehicles",
      path: "/provider/manage-vehicles",
      icon: "mdi:car",
      label: "Xe của tôi",
    },
    {
      key: "bookings",
      path: "/provider/manage-bookings",
      icon: "mdi:calendar-check",
      label: "Quản lý thuê xe",
    },
    {
      key: "contracts",
      path: "/provider/manage-contracts",
      icon: "mdi:file-document",
      label: "Quản lý hợp đồng",
    },
    {
      key: "final-contracts",
      path: "/provider/manage-final-contracts",
      icon: "mdi:file-check",
      label: "Tất toán hợp đồng",
    },
    {
      key: "final-contracts",
      path: "/provider/manage-penalties",
      icon: "mdi:pencil-box-multiple",
      label: "Quy định thuê xe",
    },
    {
      key: "change-password",
      path: "/provider/change-password",
      icon: "mdi:key",
      label: "Đổi mật khẩu",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderComponent />
      {/* Full-width layout, sát màn hình */}
      <section className="flex-1 w-full bg-[#f5f5f5] dark:bg-gray-900 py-0">
        <div className="flex min-h-screen w-full">
          {/* Sidebar - fixed width */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
            <nav>
              <ul className="space-y-1">
                {menuItems.map((item) => (
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
            </nav>
          </div>

          {/* Main content - takes all remaining space */}
          <div className="flex-1 px-6 py-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
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
