import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";

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

  // Kiểm tra xác thực khi component được mount
  useEffect(() => {
    // Nếu có thông tin người dùng trong localStorage, đặt trạng thái xác thực
    if (accessToken && storedUser) {
      try {
        const userData =
          typeof storedUser === "string" ? JSON.parse(storedUser) : storedUser;

        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Lỗi khi phân tích dữ liệu người dùng:", error);
        // Nếu có lỗi, xóa dữ liệu không hợp lệ
        logout();
      }
    }
  }, []);

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

    console.log("Login successful - User data:", userData);
  };

  const logout = () => {
    // Xóa thông tin khỏi localStorage
    clearAccessToken();
    clearStoredUser();

    // Cập nhật state
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      setStoredUser(updated); // Cập nhật vào localStorage
      return updated;
    });
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
