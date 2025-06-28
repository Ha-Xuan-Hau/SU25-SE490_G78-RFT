"use client";

import type React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import HeaderComponent from "@/components/HeaderComponent";
import FooterComponent from "@/components/FooterComponent";
import { Icon } from "@iconify/react";
import useLocalStorage from "@/hooks/useLocalStorage";

export const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
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

  const handleLogout = () => {
    // Xóa thông tin đăng nhập
    clearAccessToken();
    clearUserProfile();
    // Chuyển hướng về trang chủ
    router.push("/");
    // Thêm logic khác nếu cần (như clear recoil state)
  };

  return (
    <>
      <HeaderComponent />
      {/* Full-width layout, sát màn hình */}
      <section className="!pt-[88px] !pb-0 !py-0 !px-0 !m-0 w-full">
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
                {/* Logout button */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Icon icon="mdi:logout" className="w-5 h-5 flex-shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </li>
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
    </>
  );
};

export default ProfileLayout;
