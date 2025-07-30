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

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminProfile, , clearAdminProfile] = useLocalStorage(
    "user_profile",
    ""
  );

  // Track screen size for mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      };

      window.addEventListener("resize", handleResize);
      handleResize();

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // User authentication storage hooks
  useLocalStorage("access_token");
  useLocalStorage("user_profile", "");

  // Kiểm tra role của user (giả sử role được lưu trong adminProfile)
  const isAdmin = adminProfile?.role === "ADMIN";

  const menuGroups = [
    {
      title: "Tài khoản cá nhân",
      items: [
        {
          key: "profile",
          path: "/admin/dashboard",
          icon: "mdi:view-dashboard",
          label: "Bảng điều khiển",
        },
        {
          key: "profile",
          path: "/admin/admin-profile",
          icon: "mdi:account-circle",
          label: "Thông tin cá nhân",
        },
        {
          key: "change-password",
          path: "/admin/change-password",
          icon: "mdi:key-variant",
          label: "Đổi mật khẩu",
        },
      ],
    },
    {
      title: "Quản lý người dùng",
      items: [
        {
          key: "customers",
          path: "/admin/manage-users",
          icon: "mdi:account-group",
          label: "Quản lý người dùng",
        },
        // Chỉ Admin mới thấy menu quản lý nhân viên
        ...(isAdmin
          ? [
              {
                key: "staffs",
                path: "/admin/manage-staffs",
                icon: "mdi:account-supervisor",
                label: "Quản lý nhân viên",
              },
            ]
          : []),
      ],
    },
    {
      title: "Quản lý dịch vụ",
      items: [
        {
          key: "vehicles",
          path: "/admin/manage-vehicles",
          icon: "mdi:car-multiple",
          label: "Quản lý phương tiện",
        },
        {
          key: "vehicles",
          path: "/admin/manage-vehicles-pending",
          icon: "mdi:car-multiple",
          label: "Duyệt đăng ký phương tiện",
        },
        {
          key: "bookings",
          path: "/admin/manage-bookings",
          icon: "mdi:calendar-clock",
          label: "Quản lý đặt xe",
        },
      ],
    },
    {
      title: "Quản lý giao dịch",
      items: [
        {
          key: "withdrawal-requests",
          path: "/admin/manage-withdrawal-requests",
          icon: "mdi:cash-minus",
          label: "Yêu cầu rút tiền",
        },
        {
          key: "revenue",
          path: "/admin/manage-final-contracts",
          icon: "mdi:file-document-edit",
          label: "Tất toán hợp đồng",
        },
        ...(isAdmin
          ? [
              {
                key: "transactions",
                path: "/admin/manage-approved-withdrawal-requests",
                icon: "mdi:credit-card-outline",
                label: "Quản lý giao dịch rút tiền",
              },
              {
                key: "transactions",
                path: "/admin/manage-finalized-contracts",
                icon: "mdi:file-document-edit-outline",
                label: "Quản lý hợp đồng tất toán",
              },
            ]
          : []),
      ],
    },
    {
      title: "Quản lý khuyến mãi",
      items: [
        {
          key: "discount-codes",
          path: "/admin/manage-coupons",
          icon: "mdi:ticket-percent",
          label: "Mã giảm giá",
        },
      ],
    },
    {
      title: "Quản lý hệ thống",
      items: [
        {
          key: "licenses",
          path: "/admin/manage-driver-licenses",
          icon: "mdi:card-account-details",
          label: "Quản lý bằng lái xe",
        },
        {
          key: "reports",
          path: "/admin/manage-reports",
          icon: "mdi:chart-box",
          label: "Báo cáo từ người dùng",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderComponent />

      <section className="flex-1 w-full">
        <div className="flex min-h-screen w-full relative">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-20 left-4 z-30 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          >
            {sidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>

          {/* Sidebar */}
          <div
            className={`${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            } fixed md:relative top-0 left-0 h-full z-20 md:z-0
            w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transform transition-transform duration-300 ease-in-out md:translate-x-0
            shadow-xl md:shadow-none overflow-y-auto`}
          >
            {/* User Profile Section */}
            <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate w-full">
                  {adminProfile?.fullName || "Người dùng"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full">
                  {adminProfile?.email || "user@example.com"}
                </p>
                <span
                  className={`inline-block px-2 py-1 mt-2 text-xs font-medium rounded-full ${
                    isAdmin
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
                >
                  {isAdmin ? "Quản trị viên" : "Nhân viên"}
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
                      <li key={item.key}>
                        <Link
                          href={item.path}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                            currentPath === item.path
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon
                            icon={item.icon}
                            className={`w-5 h-5 flex-shrink-0 transition-colors ${
                              currentPath === item.path
                                ? "text-blue-600 dark:text-blue-400"
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

          {/* Backdrop for mobile */}
          {sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-10 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          {/* Main content */}
          <div className="flex-1 px-4 md:px-6 py-6 w-full">
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

export default AdminLayout;
