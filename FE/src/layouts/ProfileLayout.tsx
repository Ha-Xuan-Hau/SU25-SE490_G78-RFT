"use client";

import type React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import HeaderComponent from "@/components/HeaderComponent";
import FooterComponent from "@/components/FooterComponent";
import { Icon } from "@iconify/react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Avatar } from "antd";

export const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  const [, , clearAccessToken] = useLocalStorage("access_token");

  const [userProfile, , clearUserProfile] = useLocalStorage("user_profile", "");

  const menuItems = [
    {
      key: "profile",
      path: "/profile",
      icon: "mdi:account",
      label: "Thông tin cá nhân",
    },
    {
      key: "driver-licenses",
      path: "/profile/driver-licenses",
      icon: "mdi:id-card",
      label: "Giấy phép lái xe",
    },
    {
      key: "user-wallet",
      path: "/profile/wallets",
      icon: "mdi:wallet",
      label: "Ví của tôi",
    },
    {
      key: "car-rental",
      path: "/profile/booking-history",
      icon: "mdi:car-multiple",
      label: "Lịch sử thuê xe",
    },
    {
      key: "change-password",
      path: "/profile/change-password",
      icon: "mdi:key",
      label: "Đổi mật khẩu",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderComponent />

      {/* container ở giữa - Thêm flex-1 để phần này mở rộng lấp đầy không gian */}
      <section className="flex-1 w-full bg-gray-100 dark:bg-gray-900 py-0">
        <div className="max-w-[1200px] mx-auto px-4 xl:px-0 py-6">
          <div className="flex w-full gap-4">
            {/* Sidebar  */}
            <div className="w-[180px]  flex-shrink-0 rounded-lg overflow-hidden">
              {/* User profile section */}
              <div className="px-4 py-6 border-b ">
                <div className="flex flex-col items-center">
                  <h3 className="text-base font-semibold mt-2 text-gray-800 dark:text-white truncate w-full text-center">
                    {userProfile?.fullName || "Người dùng"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                    {userProfile?.email || "user@example.com"}
                  </p>
                </div>
              </div>

              <nav className="px-2 py-3">
                <ul className="space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.path}
                        className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-all duration-200 ${
                          currentPath === item.path
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <Icon
                          icon={item.icon}
                          className={`w-4 h-4 flex-shrink-0 ${
                            currentPath === item.path ? "text-primary" : ""
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Main content - giống layout shopee */}
            <div className="flex-1">
              <div className="bg-white border-gray-100 dark:border-gray-700 p-6">
                <div>{children}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterComponent />
    </div>
  );
};

export default ProfileLayout;
