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
import NotificationBell from "@/components/notification/NotificationBell";
import NotificationDropdown from "@/components/notification/NotificationDropdown";
import SystemNotificationModal from "@/components/notification/SystemNotificationModal";

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

  // Đóng menu khi resize window
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setNavbarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Đóng menu khi route thay đổi
  useEffect(() => {
    setNavbarOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (navbarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [navbarOpen]);

  // Hàm xử lý điều hướng dựa trên role
  const getNavigationByRole = (userRole: string) => {
    switch (userRole) {
      case "ADMIN":
        return "/admin/dashboard";
      case "STAFF":
        return "/admin/dashboard";
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
              onClick={() => router.push("/admin/manage-users")}
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
            Quản lý giao dịch
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
      <header className="relative w-full bg-white shadow-sm border-b border-gray-100">
        <nav className="w-full flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" onClick={() => setNavbarOpen(false)}>
              <Image
                src="/images/rft-logo2.png"
                alt="Car Rental Logo"
                width={100}
                height={35}
                unoptimized={true}
                className="block dark:hidden sm:w-[120px] sm:h-[42px]"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10">
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
                {/* Notification Bell */}
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

          {/* Mobile Right Section */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <NotificationBell />
              </div>
            )}

            {/* Mobile Menu Button - Hamburger Icon */}
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors relative"
              aria-label="Toggle mobile menu"
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span
                  className={`block h-0.5 w-full bg-gray-700 transform transition-all duration-300 ${
                    navbarOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-full bg-gray-700 transition-all duration-300 ${
                    navbarOpen ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-full bg-gray-700 transform transition-all duration-300 ${
                    navbarOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </nav>

        {/* Mobile Menu - Slide từ phải */}
        <div
          className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
            navbarOpen ? "translate-x-0" : "translate-x-full"
          } lg:hidden`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => setNavbarOpen(false)}
              className="p-2 rounded-md hover:bg-white/50 transition-colors"
            >
              <Icon
                icon="heroicons:x-mark-20-solid"
                width={24}
                height={24}
                className="text-gray-700"
              />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex flex-col h-[calc(100%-72px)] overflow-y-auto">
            {/* User Info Section if logged in */}
            {isAuthenticated && user && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {user?.profilePicture ? (
                    <Avatar src={user.profilePicture} size={48} />
                  ) : (
                    <Avatar
                      icon={<UserOutlined />}
                      size={48}
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
                    <div className="font-medium text-gray-900 text-base">
                      {user?.fullName || "User"}
                    </div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>
                {user?.role && (
                  <div className="mt-3">{getRoleBadge(user.role)}</div>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 py-4">
              {/* Common Navigation */}
              {(!isAuthenticated ||
                user?.role === "USER" ||
                user?.role === "PROVIDER") && (
                <>
                  <Link
                    href="/about-us"
                    className={`block px-6 py-3 text-base font-medium ${
                      pathname === "/about-us"
                        ? "text-primary bg-primary/5 border-l-4 border-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    Về RFT
                  </Link>

                  <Link
                    href="/vehicles"
                    className={`block px-6 py-3 text-base font-medium ${
                      pathname === "/vehicles"
                        ? "text-primary bg-primary/5 border-l-4 border-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    Danh sách xe
                  </Link>

                  {isAuthenticated && user?.role === "USER" && (
                    <Link
                      href="/become-provider"
                      className={`block px-6 py-3 text-base font-medium ${
                        pathname === "/become-provider"
                          ? "text-primary bg-primary/5 border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      Trở thành chủ xe
                    </Link>
                  )}
                </>
              )}

              {/* Admin/Staff Navigation */}
              {isAuthenticated &&
                (user?.role === "ADMIN" || user?.role === "STAFF") && (
                  <>
                    <Link
                      href="/about-us"
                      className={`block px-6 py-3 text-base font-medium ${
                        pathname === "/about-us"
                          ? "text-primary bg-primary/5 border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      Về RFT
                    </Link>

                    <div className="border-t border-gray-200 my-2"></div>

                    <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Quản lý hệ thống
                    </div>

                    <Link
                      href="/admin/dashboard"
                      className={`block px-6 py-3 ${
                        pathname === "/admin/dashboard"
                          ? "text-primary bg-primary/5 border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      <div className="flex items-center">
                        <DashboardOutlined className="mr-3 text-blue-600" />
                        <span className="text-base font-medium">
                          {user?.role === "ADMIN"
                            ? "Quản trị hệ thống"
                            : "Bảng điều khiển"}
                        </span>
                      </div>
                    </Link>

                    {user?.role === "ADMIN" && (
                      <Link
                        href="/admin/manage-users"
                        className={`block px-6 py-3 ${
                          pathname === "/admin/manage-users"
                            ? "text-primary bg-primary/5 border-l-4 border-primary"
                            : "text-gray-700 hover:bg-gray-50"
                        } transition-colors`}
                        onClick={() => setNavbarOpen(false)}
                      >
                        <div className="flex items-center">
                          <TeamOutlined className="mr-3 text-green-600" />
                          <span className="text-base font-medium">
                            Quản lý người dùng
                          </span>
                        </div>
                      </Link>
                    )}

                    <Link
                      href="/admin/manage-vehicles"
                      className={`block px-6 py-3 ${
                        pathname === "/admin/manage-vehicles"
                          ? "text-primary bg-primary/5 border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      <div className="flex items-center">
                        <CarOutlined className="mr-3 text-purple-600" />
                        <span className="text-base font-medium">
                          Quản lý phương tiện
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/manage-bookings"
                      className={`block px-6 py-3 ${
                        pathname === "/admin/manage-bookings"
                          ? "text-primary bg-primary/5 border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      <div className="flex items-center">
                        <FileTextOutlined className="mr-3 text-orange-600" />
                        <span className="text-base font-medium">
                          Quản lý đặt xe
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/admin/manage-transactions"
                      className={`block px-6 py-3 ${
                        pathname === "/admin/manage-transactions"
                          ? "text-primary bg-primary/5 border-l-4 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } transition-colors`}
                      onClick={() => setNavbarOpen(false)}
                    >
                      <div className="flex items-center">
                        <WalletOutlined className="mr-3 text-red-600" />
                        <span className="text-base font-medium">
                          Quản lý giao dịch
                        </span>
                      </div>
                    </Link>
                  </>
                )}

              {/* Provider Dashboard Link */}
              {isAuthenticated && user?.role === "PROVIDER" && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/provider/dashboard"
                    className={`block px-6 py-3 ${
                      pathname === "/provider/dashboard"
                        ? "text-primary bg-primary/5 border-l-4 border-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    <div className="flex items-center">
                      <DashboardOutlined className="mr-3 text-blue-600" />
                      <span className="text-base font-medium">
                        Quản lý cho thuê
                      </span>
                    </div>
                  </Link>
                </>
              )}

              {/* User Profile Link */}
              {isAuthenticated && user?.role === "USER" && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/profile"
                    className={`block px-6 py-3 ${
                      pathname === "/profile"
                        ? "text-primary bg-primary/5 border-l-4 border-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    } transition-colors`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    <div className="flex items-center">
                      <UserOutlined className="mr-3" />
                      <span className="text-base font-medium">
                        Thông tin cá nhân
                      </span>
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      openAuthPopup("login");
                    }}
                    className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      openAuthPopup("register");
                    }}
                    className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors"
                  >
                    Đăng ký
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    logout();
                    window.location.href = "/";
                  }}
                  className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm"
                >
                  <LogoutOutlined className="mr-2" />
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Background overlay khi mở mobile menu */}
        {navbarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setNavbarOpen(false)}
          />
        )}
      </header>

      <AuthPopup isOpen={isOpen} onClose={closeAuthPopup} initialMode={mode} />
      <SystemNotificationModal />
    </>
  );
};

export default HeaderComponent;
