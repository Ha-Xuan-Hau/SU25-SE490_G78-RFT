"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { User } from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import { apiClient } from "@/apis/client";
import { isTokenExpired } from "@/utils/jwt";

export type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "verify-otp"
  | "reset-password";

interface AuthContextType {
  // Quản lý popup
  isOpen: boolean;
  mode: AuthMode;
  openAuthPopup: (mode?: AuthMode) => void;
  closeAuthPopup: () => void;

  // Quản lý người dùng và xác thực
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUserFromApi: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State cho popup
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  // State cho xác thực
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Local storage hooks
  const [accessToken, setAccessToken, clearAccessToken] = useLocalStorage(
    "access_token",
    ""
  );
  const [storedUser, setStoredUser, clearStoredUser] = useLocalStorage(
    "user_profile",
    ""
  );

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kiểm tra và xóa token hết hạn
  const checkAndClearExpiredToken = () => {
    if (accessToken) {
      const token =
        typeof accessToken === "string"
          ? accessToken.replace(/^"|"$/g, "")
          : "";

      if (isTokenExpired(token)) {
        console.log("Token expired, clearing localStorage...");
        clearAccessToken();
        clearStoredUser();
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      return true;
    }
    return false;
  };

  // Kiểm tra token khi mount và setup interval
  useEffect(() => {
    // Kiểm tra token ban đầu
    if (accessToken && storedUser) {
      const token =
        typeof accessToken === "string"
          ? accessToken.replace(/^"|"$/g, "")
          : "";

      if (isTokenExpired(token)) {
        console.log("Token expired on mount, clearing...");
        clearAccessToken();
        clearStoredUser();
      } else {
        try {
          const userData =
            typeof storedUser === "string"
              ? JSON.parse(storedUser)
              : storedUser;
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
          clearAccessToken();
          clearStoredUser();
        }
      }
    }

    // Setup interval để kiểm tra mỗi 30 giây
    checkIntervalRef.current = setInterval(() => {
      checkAndClearExpiredToken();
    }, 30000); // Kiểm tra mỗi 30 giây

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Kiểm tra khi tab/window được focus lại
  useEffect(() => {
    const handleFocus = () => {
      checkAndClearExpiredToken();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkAndClearExpiredToken();
      }
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [accessToken]);

  // Xử lý popup
  const openAuthPopup = (newMode: AuthMode = "login") => {
    setMode(newMode);
    setIsOpen(true);
  };

  const closeAuthPopup = () => {
    setIsOpen(false);
  };

  // Xử lý xác thực
  const login = (userData: User, token: string) => {
    // Lưu thông tin vào localStorage
    setAccessToken(token);
    setStoredUser(userData);

    // Cập nhật state
    setUser(userData);
    setIsAuthenticated(true);

    // Đóng popup sau khi đăng nhập thành công
    closeAuthPopup();

    console.log("Login successful");
  };

  const logout = () => {
    // Xóa thông tin khỏi localStorage
    clearAccessToken();
    clearStoredUser();

    // Cập nhật state
    setUser(null);
    setIsAuthenticated(false);

    console.log("User logged out");
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      setStoredUser(updated);
      return updated;
    });
  };

  const refreshUserFromApi = async () => {
    const value = window.localStorage.getItem("access_token");
    if (value) {
      const token = JSON.parse(value).replace(/^"|"$/g, "");

      // Kiểm tra token trước khi gọi API
      if (isTokenExpired(token)) {
        logout();
        return;
      }

      try {
        const response = await apiClient.request({
          method: "GET",
          url: "/users/get-user",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setUser(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          logout();
        }
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isOpen,
        mode,
        openAuthPopup,
        closeAuthPopup,
        user,
        isAuthenticated,
        login,
        logout,
        updateUser,
        refreshUserFromApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
