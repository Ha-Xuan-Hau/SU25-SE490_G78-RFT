import React, { useState } from "react";
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
      key: "my-cars",
      path: "/profile/my-vehicles",
      icon: "mdi:car",
      label: "Xe của tôi",
    },
    {
      key: "car-rental",
      path: "/profile/car-rental",
      icon: "mdi:car-multiple",
      label: "Lịch sử thuê xe",
    },
    {
      key: "favorites",
      path: "/profile/favorites",
      icon: "mdi:heart",
      label: "Xe yêu thích",
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
      <section className="container mx-auto px-4 2xl:px-0 py-8">
        <div className="container mx-auto px-4 py-8 min-h-screen">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {userProfile?.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon
                        icon="mdi:account"
                        className="w-8 h-8 text-gray-500"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg dark:text-white">
                      {userProfile?.username || "Người dùng"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {userProfile?.email || "email@example.com"}
                    </p>
                  </div>
                </div>

                <nav>
                  <ul className="space-y-2">
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
                          <Icon icon={item.icon} className="w-5 h-5" />
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
                        <Icon icon="mdi:logout" className="w-5 h-5" />
                        <span>Đăng xuất</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:w-3/4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
      <FooterComponent />
    </>
  );
};

export default ProfileLayout;
