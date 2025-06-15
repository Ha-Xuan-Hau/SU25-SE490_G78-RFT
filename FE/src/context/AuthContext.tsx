import React, { createContext, useContext, useState } from "react";

export type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "verify-otp"
  | "reset-password";

interface AuthContextType {
  isOpen: boolean;
  mode: AuthMode;
  openAuthPopup: (mode?: AuthMode) => void;
  closeAuthPopup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const openAuthPopup = (newMode: AuthMode = "login") => {
    setMode(newMode);
    setIsOpen(true);
  };

  const closeAuthPopup = () => {
    setIsOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{ isOpen, mode, openAuthPopup, closeAuthPopup }}
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
