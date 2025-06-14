"use client";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { AuthPopup } from "@/components/AuthPopup";

const Header: React.FC = () => {
  const [sticky, setSticky] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);
  const pathname = usePathname();
  const { openAuthPopup, isOpen, closeAuthPopup, mode } = useAuth();

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const isHomepage = pathname === "/";

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

          {/* Auth Buttons */}
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
              href="/locations"
              className={`text-base font-medium ${
                pathname === "/locations"
                  ? "text-primary"
                  : "text-dark hover:text-primary"
              }`}
            >
              Trở thành chủ xe
            </Link>
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

        {/* Mobile Menu Overlay */}
        {navbarOpen && (
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/50 z-40"
            onClick={() => setNavbarOpen(false)}
          />
        )}
      </header>
      <AuthPopup isOpen={isOpen} onClose={closeAuthPopup} initialMode={mode} />
    </>
  );
};

export default Header;
