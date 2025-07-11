"use client";

import type React from "react";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { AuthPopup } from "@/components/AuthPopup";
import { Avatar, Dropdown } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

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

  // Dropdown items cho user menu
  const dropdownItems = [
    {
      key: "0",
      label: (
        <div
          onClick={() => {
            const userRole = user?.role || user?.role;
            if (userRole === "PROVIDER") {
              router.push("/provider/dashboard");
            } else {
              router.push("/profile");
            }
          }}
          className="flex items-center"
        >
          <UserOutlined className="mr-2" />
          {(user?.role || user?.role) === "PROVIDER"
            ? "Quản lý cho thuê"
            : "Thông tin cá nhân"}
        </div>
      ),
    },
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex items-center"
        >
          <LogoutOutlined className="text-red-600 mr-2" />
          Đăng xuất
        </div>
      ),
    },
  ];

  return (
    <>
      <header className="relative h-18 py-1 w-full bg-white shadow-sm">
        {/* Full-width nav, logo sát trái, links sát phải */}
        <nav className="w-full flex items-start justify-between py-2 px-4">
          {/* Logo sát bên trái */}
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

          {/* Navigation Links sát bên phải */}
          <div className="hidden lg:flex items-center space-x-10 mt-1">
            <Link
              href="/about-us"
              className={`text-base font-medium ${
                pathname === "/about-us"
                  ? "text-primary font-semibold"
                  : "text-dark"
              } hover:text-primary`}
            >
              Về RFT
            </Link>

            <Link
              href="/vehicles"
              className={`text-base font-medium ${
                pathname === "/vehicles"
                  ? "text-primary font-semibold"
                  : "text-dark"
              } hover:text-primary`}
            >
              Danh sách xe
            </Link>

            {isAuthenticated && user?.role === "USER" && (
              <Link
                href="/become-provider"
                className={`text-base font-medium ${
                  pathname === "/become-provider"
                    ? "text-primary font-semibold"
                    : "text-dark"
                } hover:text-primary`}
              >
                Trở thành chủ xe
              </Link>
            )}

            {/* Hiển thị nút đăng nhập/đăng ký hoặc avatar người dùng */}
            {!isAuthenticated ? (
              <>
                <span className="text-dark">|</span>
                <button
                  onClick={() => openAuthPopup("login")}
                  className="text-base font-medium text-dark hover:text-primary"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => openAuthPopup("register")}
                  className="text-base py-2 px-3 text-dark border border-dark rounded font-medium hover:border-primary hover:text-primary transition duration-300"
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Dropdown
                  menu={{ items: dropdownItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    {user?.profilePicture ? (
                      <Avatar src={user.profilePicture} />
                    ) : (
                      <Avatar icon={<UserOutlined />} />
                    )}
                    <span className="font-medium">
                      {user?.fullName || user?.email}
                    </span>
                  </div>
                </Dropdown>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle mobile menu"
            >
              <Icon
                icon="heroicons:menu-20-solid"
                width={24}
                height={24}
                className="text-gray-700"
              />
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {navbarOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t shadow-md z-40 py-4 px-6">
            <div className="flex flex-col space-y-4">
              <Link
                href="/about"
                className={`text-base font-medium ${
                  pathname === "/about"
                    ? "text-primary font-semibold"
                    : "text-dark"
                } hover:text-primary`}
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
                } hover:text-primary`}
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
                  } hover:text-primary`}
                  onClick={() => setNavbarOpen(false)}
                >
                  Trở thành chủ xe
                </Link>
              )}

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      openAuthPopup("login");
                    }}
                    className="text-base font-medium text-dark hover:text-primary text-left"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      openAuthPopup("register");
                    }}
                    className="text-base font-medium text-dark hover:text-primary/80 text-left"
                  >
                    Đăng ký
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 py-2">
                    {user?.profilePicture ? (
                      <Avatar src={user.profilePicture} />
                    ) : (
                      <Avatar icon={<UserOutlined />} />
                    )}
                    <span className="font-medium">
                      {user?.fullName || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      // Kiểm tra role dựa vào cấu trúc của đối tượng user
                      const userRole = user?.role || user?.role;
                      if (userRole === "PROVIDER") {
                        router.push("/provider/dashboard"); // hoặc URL chính xác cho provider
                      } else {
                        router.push("/profile");
                      }
                    }}
                    className="text-base font-medium text-dark hover:text-primary text-left flex items-center"
                  >
                    <UserOutlined className="mr-2" />
                    {(user?.role || user?.role) === "PROVIDER"
                      ? "Quản lý cho thuê"
                      : "Thông tin cá nhân"}
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setNavbarOpen(false);
                      router.push("/profile");
                    }}
                    className="text-base font-medium text-red-600 hover:text-red-700 text-left flex items-center"
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
          className="fixed top-0 left-0 w-full h-full bg-black/50 z-30"
          onClick={() => setNavbarOpen(false)}
        />
      )}

      <AuthPopup isOpen={isOpen} onClose={closeAuthPopup} initialMode={mode} />
    </>
  );
};

export default HeaderComponent;
