"use client";

import type React from "react";
import type { MenuProps } from "antd";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { AuthPopup } from "@/components/AuthPopup";
import { Avatar, Dropdown } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  CarOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import NotificationBell from "@/components/NotificationBell";
import NotificationDropdown from "@/components/NotificationDropdown";
import SystemNotificationModal from "@/components/SystemNotificationModal";

const HeaderComponent: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    isAuthenticated,
    logout,
    openAuthPopup,
    isOpen,
    closeAuthPopup,
    mode,
  } = useAuth();

  // Hàm xử lý điều hướng dựa trên role
  const getNavigationByRole = (userRole: string) => {
    switch (userRole) {
      case "ADMIN":
        return "/admin/dashboard";
      case "STAFF":
        return "/admin/dashboard"; // Staff và Admin dùng chung layout
      case "PROVIDER":
        return "/provider/dashboard";
      default:
        return "/profile";
    }
  };

  // Tạo dropdown items dựa trên role với type chính xác
  const getDropdownItems = (): MenuProps["items"] => {
    const userRole = user?.role;
    const baseItems: MenuProps["items"] = [];

    // Menu chung cho tất cả user đã đăng nhập
    if (userRole === "ADMIN" || userRole === "STAFF") {
      // Menu cho Admin/Staff
      baseItems?.push({
        key: "dashboard",
        label: (
          <div
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center py-1"
          >
            <DashboardOutlined className="mr-2 text-blue-600" />
            {userRole === "ADMIN" ? "Quản trị hệ thống" : "Bảng điều khiển"}
          </div>
        ),
      });

      // Divider
      baseItems?.push({
        type: "divider",
      });

      // Quick access header
      baseItems?.push({
        key: "quick-access-header",
        label: (
          <div className="text-xs text-gray-500 font-medium px-2 py-1 cursor-default">
            TRUY CẬP NHANH
          </div>
        ),
        disabled: true,
      });

      if (userRole === "ADMIN") {
        baseItems?.push({
          key: "manage-users",
          label: (
            <div
              onClick={() => router.push("/admin/manage-customers")}
              className="flex items-center py-1"
            >
              <TeamOutlined className="mr-2 text-green-600" />
              Quản lý người dùng
            </div>
          ),
        });
      }

      baseItems?.push({
        key: "manage-vehicles",
        label: (
          <div
            onClick={() => router.push("/admin/manage-vehicles")}
            className="flex items-center py-1"
          >
            <CarOutlined className="mr-2 text-purple-600" />
            Quản lý phương tiện
          </div>
        ),
      });

      baseItems?.push({
        key: "manage-bookings",
        label: (
          <div
            onClick={() => router.push("/admin/manage-bookings")}
            className="flex items-center py-1"
          >
            <FileTextOutlined className="mr-2 text-orange-600" />
            Quản lý đặt xe
          </div>
        ),
      });

      baseItems?.push({
        key: "financial",
        label: (
          <div
            onClick={() => router.push("/admin/manage-transactions")}
            className="flex items-center py-1"
          >
            <WalletOutlined className="mr-2 text-red-600" />
            Quản lý tài chính
          </div>
        ),
      });
    } else if (userRole === "PROVIDER") {
      // Menu cho Provider
      baseItems?.push({
        key: "provider-dashboard",
        label: (
          <div
            onClick={() => router.push("/provider/dashboard")}
            className="flex items-center py-1"
          >
            <DashboardOutlined className="mr-2 text-blue-600" />
            Quản lý cho thuê
          </div>
        ),
      });
    } else {
      // Menu cho User thường
      baseItems?.push({
        key: "profile",
        label: (
          <div
            onClick={() => router.push("/profile")}
            className="flex items-center py-1"
          >
            <UserOutlined className="mr-2" />
            Thông tin cá nhân
          </div>
        ),
      });
    }

    // Menu đăng xuất
    baseItems?.push({
      key: "logout",
      label: (
        <div
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex items-center py-1"
        >
          <LogoutOutlined className="text-red-600 mr-2" />
          <span className="text-red-600">Đăng xuất</span>
        </div>
      ),
    });

    return baseItems;
  };

  // Hiển thị role badge
  const getRoleBadge = (role: string) => {
    const badgeConfig = {
      ADMIN: {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Admin",
      },
      STAFF: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Staff",
      },
      PROVIDER: {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Provider",
      },
      USER: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: "User",
      },
    };

    const config =
      badgeConfig[role as keyof typeof badgeConfig] || badgeConfig.USER;

    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${config.color} ml-2`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <>
      <header className="relative h-18 py-1 w-full bg-white shadow-sm border-b border-gray-100">
        <nav className="w-full flex items-start justify-between py-2 px-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/images/rft-logo2.png"
                alt="Car Rental Logo"
                width={120}
                height={42}
                unoptimized={true}
                className="block dark:hidden"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10 mt-1">
            {/* Hiển thị menu navigation chỉ cho USER và chưa đăng nhập */}
            {(!isAuthenticated || user?.role === "PROVIDER") && (
              <>
                <Link
                  href="/about-us"
                  className={`text-base font-medium ${
                    pathname === "/about-us"
                      ? "text-primary font-semibold"
                      : "text-dark"
                  } hover:text-primary transition-colors`}
                >
                  Về RFT
                </Link>

                <Link
                  href="/vehicles"
                  className={`text-base font-medium ${
                    pathname === "/vehicles"
                      ? "text-primary font-semibold"
                      : "text-dark"
                  } hover:text-primary transition-colors`}
                >
                  Danh sách xe
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === "USER" && (
              <>
                <Link
                  href="/about-us"
                  className={`text-base font-medium ${
                    pathname === "/about-us"
                      ? "text-primary font-semibold"
                      : "text-dark"
                  } hover:text-primary transition-colors`}
                >
                  Về RFT
                </Link>

                <Link
                  href="/vehicles"
                  className={`text-base font-medium ${
                    pathname === "/vehicles"
                      ? "text-primary font-semibold"
                      : "text-dark"
                  } hover:text-primary transition-colors`}
                >
                  Danh sách xe
                </Link>

                <Link
                  href="/become-provider"
                  className={`text-base font-medium ${
                    pathname === "/become-provider"
                      ? "text-primary font-semibold"
                      : "text-dark"
                  } hover:text-primary transition-colors`}
                >
                  Trở thành chủ xe
                </Link>
              </>
            )}

            {isAuthenticated &&
              (user?.role === "STAFF" || user?.role === "ADMIN") && (
                <Link
                  href="/about-us"
                  className={`text-base font-medium ${
                    pathname === "/about-us"
                      ? "text-primary font-semibold"
                      : "text-dark"
                  } hover:text-primary transition-colors`}
                >
                  Về RFT
                </Link>
              )}

            {/* Auth Section */}
            {!isAuthenticated ? (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => openAuthPopup("login")}
                  className="text-base font-medium text-dark hover:text-primary transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => openAuthPopup("register")}
                  className="text-base py-2 px-4 text-dark border border-dark rounded-lg font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {/* Notification Bell - chỉ hiện khi đăng nhập */}
                <div className="relative">
                  <NotificationBell />
                  <NotificationDropdown />
                </div>
                <Dropdown
                  menu={{ items: getDropdownItems() }}
                  placement="bottomRight"
                  trigger={["click"]}
                  overlayStyle={{ minWidth: "280px" }}
                  overlayClassName="user-dropdown"
                >
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                    {user?.profilePicture ? (
                      <Avatar src={user.profilePicture} size="default" />
                    ) : (
                      <Avatar
                        icon={<UserOutlined />}
                        size="default"
                        style={{
                          backgroundColor:
                            user?.role === "ADMIN"
                              ? "#ef4444"
                              : user?.role === "STAFF"
                              ? "#3b82f6"
                              : user?.role === "PROVIDER"
                              ? "#10b981"
                              : "#6b7280",
                        }}
                      />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm text-gray-900">
                        {user?.fullName || user?.email}
                      </span>
                      {/* {user?.role && (
                        <span className="text-xs text-gray-500">
                          {getProfileLabelByRole(user.role)}
                        </span>
                      )} */}
                    </div>
                    {user?.role && getRoleBadge(user.role)}
                    <Icon
                      icon="heroicons:chevron-down-20-solid"
                      className="w-4 h-4 text-gray-400 ml-1"
                    />
                  </div>
                </Dropdown>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <Icon
                icon={
                  navbarOpen
                    ? "heroicons:x-mark-20-solid"
                    : "heroicons:menu-20-solid"
                }
                width={24}
                height={24}
                className="text-gray-700"
              />
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {navbarOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t shadow-lg z-40 py-4 px-6">
            <div className="flex flex-col space-y-4">
              {/* Mobile menu content chỉ hiển thị navigation cho USER và chưa đăng nhập */}
              {(!isAuthenticated || user?.role === "USER") && (
                <>
                  <Link
                    href="/about-us"
                    className={`text-base font-medium ${
                      pathname === "/about-us"
                        ? "text-primary font-semibold"
                        : "text-dark"
                    } hover:text-primary transition-colors`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    Về RFT
                  </Link>

                  <Link
                    href="/vehicles"
                    className={`text-base font-medium ${
                      pathname === "/vehicles"
                        ? "text-primary font-semibold"
                        : "text-dark"
                    } hover:text-primary transition-colors`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    Danh sách xe
                  </Link>

                  {isAuthenticated && user?.role === "USER" && (
                    <Link
                      href="/become-provider"
                      className={`text-base font-medium text-dark ${
                        pathname === "/become-provider"
                          ? "text-primary font-semibold"
                          : "text-dark"
                      } hover:text-primary transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      Trở thành chủ xe
                    </Link>
                  )}
                </>
              )}

              {/* Auth section cho mobile */}
              {!isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      openAuthPopup("login");
                    }}
                    className="text-base font-medium text-dark hover:text-primary text-left transition-colors"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      openAuthPopup("register");
                    }}
                    className="text-base font-medium text-dark hover:text-primary/80 text-left transition-colors"
                  >
                    Đăng ký
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex items-center gap-3 py-2 px-2 bg-gray-50 rounded-lg">
                    {user?.profilePicture ? (
                      <Avatar src={user.profilePicture} />
                    ) : (
                      <Avatar
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor:
                            user?.role === "ADMIN"
                              ? "#ef4444"
                              : user?.role === "STAFF"
                              ? "#3b82f6"
                              : user?.role === "PROVIDER"
                              ? "#10b981"
                              : "#6b7280",
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user?.fullName || user?.email}
                      </div>
                      {/* <div className="text-sm text-gray-500">
                        {getProfileLabelByRole(user?.role || "USER")}
                      </div> */}
                    </div>
                    {user?.role && getRoleBadge(user.role)}
                  </div>

                  {/* <button
                    onClick={() => {
                      setNavbarOpen(false);
                      router.push(getNavigationByRole(user?.role || "USER"));
                    }}
                    className="text-base font-medium text-dark hover:text-primary text-left flex items-center transition-colors"
                  >
                    <DashboardOutlined className="mr-2" />
                    {getProfileLabelByRole(user?.role || "USER")}
                  </button> */}

                  <button
                    onClick={() => {
                      logout();
                      setNavbarOpen(false);
                      router.push("/");
                    }}
                    className="text-base font-medium text-red-600 hover:text-red-700 text-left flex items-center transition-colors"
                  >
                    <LogoutOutlined className="mr-2" />
                    Đăng xuất
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Background overlay khi mở mobile menu */}
      {navbarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setNavbarOpen(false)}
        />
      )}

      <AuthPopup isOpen={isOpen} onClose={closeAuthPopup} initialMode={mode} />
    </>
  );
};

export default HeaderComponent;
<SystemNotificationModal />;
