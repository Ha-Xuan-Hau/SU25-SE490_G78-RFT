"use client";
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
  const [sticky, setSticky] = useState(false);
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

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Dropdown items cho user menu
  const dropdownItems = [
    {
      key: "0",
      label: (
        <div
          onClick={() => router.push("/profile")}
          className="flex items-center"
        >
          <UserOutlined className="mr-2" />
          Thông tin cá nhân
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
      <header
        className={`fixed h-18 py-1 z-50 w-full bg-white transition-all duration-300 shadow-sm ${
          sticky ? "top-0" : "top-0"
        }`}
      >
        <nav className="container mx-auto max-w-8xl flex items-start justify-between py-2 px-4 lg:px-0">
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

          {/* Navigation Links and Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-10 mt-1">
            <Link
              href="/about"
              className={`text-base font-medium ${
                pathname === "/about"
                  ? "text-primary"
                  : "text-dark hover:text-primary"
              }`}
            >
              Về RFT
            </Link>
            <Link
              href="/vehicles"
              className={`text-base font-medium ${
                pathname === "/vehicles"
                  ? "text-primary"
                  : "text-dark hover:text-primary"
              }`}
            >
              Danh sách xe
            </Link>
            <Link
              href="/locations"
              className={`text-base font-medium ${
                pathname === "/locations"
                  ? "text-primary"
                  : "text-dark hover:text-primary"
              }`}
            >
              Trở thành chủ xe
            </Link>

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
                      {user?.name || user?.role}
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
                className="text-base font-medium text-dark hover:text-primary"
                onClick={() => setNavbarOpen(false)}
              >
                Về RFT
              </Link>
              <Link
                href="/vehicles"
                className="text-base font-medium text-dark hover:text-primary"
                onClick={() => setNavbarOpen(false)}
              >
                Danh sách xe
              </Link>
              <Link
                href="/locations"
                className="text-base font-medium text-dark hover:text-primary"
                onClick={() => setNavbarOpen(false)}
              >
                Trở thành chủ xe
              </Link>

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
                    className="text-base font-medium text-primary hover:text-primary/80 text-left"
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
                      {user?.name || user?.id}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNavbarOpen(false);
                      router.push("/profile");
                    }}
                    className="text-base font-medium text-dark hover:text-primary text-left flex items-center"
                  >
                    <UserOutlined className="mr-2" />
                    Thông tin cá nhân
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
