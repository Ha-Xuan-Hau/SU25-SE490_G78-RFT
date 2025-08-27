import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
  SetterOrUpdater,
} from "recoil";
import { apiClient } from "../apis/client";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { accessTokenAtom } from "./accessToken.state";
import { User } from "@/types/user";
import { AxiosResponse } from "axios";

// Atoms
export const userAtom = atom<User | null>({
  key: `user_${Date.now()}`,
  default: null,
});

export const userStatusCheckEnabledAtom = atom<boolean>({
  key: `user_status_check_${Date.now()}`,
  default: true,
});

// Global flag to prevent multiple instances of polling
let isPollingActive = false;
let lastDeactivationTime = 0;

// Interface for API response
interface UserApiResponse {
  data?: User;
  result?: User;
  status?: string;
  isActive?: boolean;
}

/**
 * Fetch user profile data from API
 */
export const fetchUserProfile = async (
  setUser: SetterOrUpdater<User | null>
): Promise<User | null> => {
  try {
    if (typeof window !== "undefined") {
      const value = window.localStorage.getItem("access_token");

      if (value !== null) {
        let token = value;
        if (token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        }

        const response: AxiosResponse<UserApiResponse> =
          await apiClient.request({
            method: "GET",
            url: "/users/get-user",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: false,
            timeout: 10000,
          });

        console.log("API response:", response);

        // Check response structure
        const userData = response.data?.result || response.data;

        if (userData.status === "INACTIVE") {
          throw new Error("ACCOUNT_DEACTIVATED");
        }

        if (userData.status === "TEMP_BANNED") {
          throw new Error("ACCOUNT_TEMP_BANNED");
        }

        setUser(userData as User);
        return userData as User;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error details:", error);

    if (
      error.message === "ACCOUNT_DEACTIVATED" ||
      error.response?.status === 403 ||
      error.response?.data?.code === "ACCOUNT_DEACTIVATED"
    ) {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }

    return null;
  }
};

/**
 * Check user status from API
 */
const checkUserStatus = async (userId: string): Promise<User | null> => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token || !userId) return null;

    let cleanToken = token;
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1);
    }

    const response: AxiosResponse<UserApiResponse> = await apiClient.request({
      method: "GET",
      url: `/users/get-user`,
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        "Content-Type": "application/json",
      },
      withCredentials: false,
      timeout: 5000,
    });

    // Handle both possible response structures
    const userData = response.data?.result || response.data;
    return userData as User;
  } catch (error: any) {
    console.error("Error checking user status:", error);
    if (error.response?.status === 403) {
      throw new Error("ACCOUNT_DEACTIVATED");
    }
    return null;
  }
};

/**
 * Hook to access and update user state with status monitoring
 * Only the FIRST instance will run the polling
 */
export const useUserState = (): [User | null, SetterOrUpdater<User | null>] => {
  const [user, setUser] = useRecoilState(userAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const [statusCheckEnabled] = useRecoilState(userStatusCheckEnabledAtom);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMainInstance = useRef<boolean>(false);

  // Initial load
  useEffect(() => {
    if (user === null) {
      fetchUserProfile(setUser);
    }
  }, [user, setUser]);

  // Status monitoring with polling - ONLY ONE INSTANCE
  useEffect(() => {
    // Check if this should be the main polling instance
    if (!isPollingActive && user?.id && statusCheckEnabled) {
      isPollingActive = true;
      isMainInstance.current = true;
      console.log("This instance will handle polling");
    }

    // Only proceed if this is the main instance
    if (!isMainInstance.current || !user?.id || !statusCheckEnabled) {
      return;
    }

    const handleAccountDeactivated = (): void => {
      // Prevent duplicate handling within 5 seconds
      const now = Date.now();
      if (now - lastDeactivationTime < 5000) {
        console.log("Deactivation already handled recently, skipping...");
        return;
      }
      lastDeactivationTime = now;

      console.log("Account deactivated, logging out...");

      // Clear user state
      setUser(null);
      setAccessToken(null);

      // Clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Show notification with unique ID to prevent duplicates
      toast.error(
        "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin để biết thêm chi tiết.",
        {
          position: "top-center",
          autoClose: 5000,
          toastId: "account-deactivated",
        }
      );

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
    };

    const handleAccountTempBanned = (): void => {
      // Prevent duplicate handling within 5 seconds
      const now = Date.now();
      if (now - lastDeactivationTime < 5000) {
        console.log("Deactivation already handled recently, skipping...");
        return;
      }
      lastDeactivationTime = now;

      console.log("Account deactivated, logging out...");

      // Clear user state
      setUser(null);
      setAccessToken(null);

      // Clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Show notification with unique ID to prevent duplicates
      toast.error(
        "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ admin để biết thêm chi tiết.",
        {
          position: "top-center",
          autoClose: 5000,
          toastId: "account-temp-banned",
        }
      );

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
    };

    const performStatusCheck = async (): Promise<void> => {
      try {
        const userData = await checkUserStatus(user.id);

        if (!userData) return;

        if (userData.status === "INACTIVE") {
          handleAccountDeactivated();
        }
        if (userData.status === "TEMP_BANNED") {
          handleAccountTempBanned();
        }
      } catch (error: any) {
        if (error.message === "ACCOUNT_DEACTIVATED") {
          handleAccountDeactivated();
        }
      }
    };

    // Initial check after 2 seconds
    const initialTimeout = setTimeout(performStatusCheck, 2000);

    // Set up interval for periodic checks (every 10 seconds)
    intervalRef.current = setInterval(performStatusCheck, 10000);

    // Check when tab becomes visible again
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        performStatusCheck();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Reset global flag if this was the main instance
      if (isMainInstance.current) {
        isPollingActive = false;
        isMainInstance.current = false;
        console.log("Main polling instance cleaned up");
      }
    };
  }, [user?.id, statusCheckEnabled, setUser, setAccessToken, router]);

  return [user, setUser];
};

/**
 * Hook to access user state without setter
 */
export const useUserValue = (): User | null => useRecoilValue(userAtom);

/**
 * Hook to manually refresh user data
 */
export const useRefreshUser = (): (() => Promise<User | null>) => {
  const [, setUser] = useRecoilState(userAtom);
  return () => fetchUserProfile(setUser);
};

/**
 * Hook to logout user
 */
export const useLogout = (): (() => void) => {
  const setUser = useSetRecoilState(userAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const router = useRouter();

  return () => {
    // Reset deactivation tracking
    lastDeactivationTime = 0;

    // Clear state
    setUser(null);
    setAccessToken(null);

    // Clear storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Redirect
    router.push("/");

    // Show message
    toast.success("Đăng xuất thành công");
  };
};

/**
 * Hook to toggle user status checking
 */
interface UserStatusCheckReturn {
  enabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export const useUserStatusCheck = (): UserStatusCheckReturn => {
  const [enabled, setEnabled] = useRecoilState(userStatusCheckEnabledAtom);

  return {
    enabled,
    toggle: () => setEnabled(!enabled),
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
  };
};
