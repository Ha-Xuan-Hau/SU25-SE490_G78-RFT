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

// Danh sách các trang chỉ Admin được truy cập
const ADMIN_ONLY_PATHS = [
  "/admin/manage-staffs",
  "/admin/manage-approved-withdrawal-requests",
  "/admin/manage-finalized-contracts",
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false); // Luôn false mặc định
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // GỌI TẤT CẢ HOOKS TRƯỚC BẤT KỲ RETURN NÀO
  const [adminProfile, , clearAdminProfile] = useLocalStorage(
    "user_profile",
    ""
  );

  useLocalStorage("access_token");

  const isAdmin = adminProfile?.role === "ADMIN";
  const isStaff = adminProfile?.role === "STAFF";

  // Check role authorization - giữ nguyên
  useEffect(() => {
    const checkAuthorization = () => {
      const storedUser = localStorage.getItem("user_profile");

      if (!storedUser) {
        window.location.href = "/";
        return;
      }

      try {
        const user = JSON.parse(storedUser);

        if (user.role === "ADMIN" || user.role === "STAFF") {
          if (user.role === "STAFF" && ADMIN_ONLY_PATHS.includes(currentPath)) {
            router.push("/404");
            return;
          }
          setIsAuthorized(true);
        } else {
          router.push("/404");
        }
      } catch (error) {
        console.error("Error parsing user profile:", error);
        router.push("/404");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [router, currentPath]);

  // Lắng nghe event từ header để toggle sidebar
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

  // XÓA hoặc SỬA LẠI useEffect resize - không tự động mở sidebar nữa
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        // Chỉ đóng sidebar khi resize xuống mobile, KHÔNG tự động mở khi lên desktop
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        }
        // XÓA dòng else setSidebarOpen(true)
      };

      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuGroups = [
    {
      title: "Tài khoản cá nhân",
      items: [
        {
          key: "dashboard",
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
          key: "vehicles-pending",
          path: "/admin/manage-vehicles-pending",
          icon: "mdi:car-multiple",
          label: "Duyệt đăng ký phương tiện",
        },
        {
          key: "bookings",
          path: "/admin/manage-bookings",
          icon: "mdi:calendar-clock",
          label: "Quản lý đơn đặt xe",
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
        // {
        //   key: "revenue",
        //   path: "/admin/manage-final-contracts",
        //   icon: "mdi:file-document-edit",
        //   label: "Tất toán hợp đồng",
        // },
        // Chỉ Admin mới thấy các menu này
        ...(isAdmin
          ? [
              {
                key: "transactions",
                path: "/admin/manage-approved-withdrawal-requests",
                icon: "mdi:credit-card-outline",
                label: "Quản lý giao dịch rút tiền",
              },
              {
                key: "finalized-contracts",
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

  // Show loading while checking authorization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderComponent />

      <section className="flex-1 w-full">
        <div className="flex min-h-screen w-full relative">
          {/* Mobile sidebar toggle button - giữ nguyên */}
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-20 left-4 z-30 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          >
            {sidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>

          {/* Sidebar - SỬA LẠI className để luôn ẩn mặc định */}
          <div
            className={`${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } fixed top-0 left-0 h-full z-40
            w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transform transition-transform duration-300 ease-in-out
            shadow-xl overflow-y-auto`}
          >
            {/* Thêm nút close trong sidebar */}
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

            {/* User Profile Section - giữ nguyên */}
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

            {/* Navigation Menu - giữ nguyên */}
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

          {/* Backdrop - hiển thị cho cả desktop và mobile khi sidebar mở */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={toggleSidebar}
            />
          )}

          {/* Main content - luôn full width */}
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
