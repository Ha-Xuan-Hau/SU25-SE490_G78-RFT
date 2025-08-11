import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
  SetterOrUpdater,
} from "recoil";
import { apiClient } from "../apis/client";
import { useEffect, useRef } from "react";
import { showApiError, showApiSuccess } from "../utils/toast.utils";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { accessTokenAtom } from "./accessToken.state";
import { User as Admin } from "@/types/user";
import { AxiosResponse } from "axios";

// Atoms
export const adminAtom = atom<Admin | null>({
  key: `admin_${Date.now()}`,
  default: null,
});

export const adminStatusCheckEnabledAtom = atom<boolean>({
  key: `admin_status_check_${Date.now()}`,
  default: true,
});

// Global flag to prevent multiple instances of polling
let isAdminPollingActive = false;
let lastAdminDeactivationTime = 0;

// Interface for API response
interface AdminApiResponse {
  data?: Admin;
  result?: Admin;
  status?: string;
  isActive?: boolean;
  role?: string;
}

/**
 * Fetch admin profile data from API
 */
export const fetchAdminProfile = async (
  setAdmin: SetterOrUpdater<Admin | null>
): Promise<Admin | null> => {
  try {
    if (typeof window !== "undefined") {
      const value = window.localStorage.getItem("access_token");
      console.log("Token from localStorage:", value);

      if (value !== null) {
        let token = value;
        if (token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        }

        console.log("API request starting for admin...");

        const response: AxiosResponse<AdminApiResponse> =
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

        console.log("Admin API response:", response);

        // Handle both response structures
        const userData = response.data?.result || response.data;

        if (userData) {
          console.log("User role:", userData.role);

          // Check if user is an admin
          if (userData.role === "ADMIN") {
            // Check if admin is active
            if (userData.status === "INACTIVE") {
              throw new Error("ACCOUNT_DEACTIVATED");
            }

            setAdmin(userData as Admin);
            return userData as Admin;
          } else {
            console.warn("User is not an admin, access denied.");
            return null;
          }
        } else {
          console.warn("No user data returned");
          return null;
        }
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching admin profile:", {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config,
    });

    // Handle account deactivation
    if (
      error.message === "ACCOUNT_DEACTIVATED" ||
      error.response?.status === 403 ||
      error.response?.data?.code === "ACCOUNT_DEACTIVATED"
    ) {
      setAdmin(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      showApiError(error, "Tài khoản admin đã bị vô hiệu hóa");
    } else {
      showApiError(error, "Không thể tải thông tin tài khoản admin");
    }

    return null;
  }
};

/**
 * Check admin status from API
 */
const checkAdminStatus = async (adminId: string): Promise<Admin | null> => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token || !adminId) return null;

    let cleanToken = token;
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1);
    }

    const response: AxiosResponse<AdminApiResponse> = await apiClient.request({
      method: "GET",
      url: `/users/get-user`,
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        "Content-Type": "application/json",
      },
      withCredentials: false,
      timeout: 5000,
    });

    const userData = response.data?.result || response.data;

    // Verify it's still an admin
    if (userData?.role !== "ADMIN") {
      throw new Error("NOT_ADMIN");
    }

    return userData as Admin;
  } catch (error: any) {
    console.error("Error checking admin status:", error);
    if (error.response?.status === 403 || error.message === "NOT_ADMIN") {
      throw new Error("ACCOUNT_DEACTIVATED");
    }
    return null;
  }
};

/**
 * Hook to access and update admin state with status monitoring
 */
export const useAdminState = (): [
  Admin | null,
  SetterOrUpdater<Admin | null>
] => {
  const [admin, setAdmin] = useRecoilState(adminAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const [statusCheckEnabled] = useRecoilState(adminStatusCheckEnabledAtom);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMainInstance = useRef<boolean>(false);

  // Initial load
  useEffect(() => {
    if (admin === null) {
      fetchAdminProfile(setAdmin);
    }
  }, [admin, setAdmin]);

  // Status monitoring with polling - ONLY ONE INSTANCE
  useEffect(() => {
    // Check if this should be the main polling instance
    if (!isAdminPollingActive && admin?.id && statusCheckEnabled) {
      isAdminPollingActive = true;
      isMainInstance.current = true;
      console.log("Admin polling instance started");
    }

    // Only proceed if this is the main instance
    if (!isMainInstance.current || !admin?.id || !statusCheckEnabled) {
      return;
    }

    const handleAdminDeactivated = (): void => {
      // Prevent duplicate handling within 5 seconds
      const now = Date.now();
      if (now - lastAdminDeactivationTime < 5000) {
        console.log("Admin deactivation already handled recently, skipping...");
        return;
      }
      lastAdminDeactivationTime = now;

      console.log("Admin account deactivated, logging out...");

      // Clear admin state
      setAdmin(null);
      setAccessToken(null);

      // Clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Show notification with unique ID
      toast.error(
        "Tài khoản admin của bạn đã bị vô hiệu hóa. Vui lòng liên hệ super admin.",
        {
          position: "top-center",
          autoClose: 5000,
          toastId: "admin-deactivated",
        }
      );

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
    };

    const performStatusCheck = async (): Promise<void> => {
      try {
        const adminData = await checkAdminStatus(admin.id);

        if (!adminData) return;

        // Check various deactivation conditions
        if (adminData.status === "INACTIVE" || adminData.role !== "ADMIN") {
          handleAdminDeactivated();
        }
      } catch (error: any) {
        if (error.message === "ACCOUNT_DEACTIVATED") {
          handleAdminDeactivated();
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
        isAdminPollingActive = false;
        isMainInstance.current = false;
        console.log("Admin polling instance cleaned up");
      }
    };
  }, [admin?.id, statusCheckEnabled, setAdmin, setAccessToken, router]);

  return [admin, setAdmin];
};

/**
 * Hook to access admin state without setter
 */
export const useAdminValue = (): Admin | null => useRecoilValue(adminAtom);

/**
 * Hook to manually refresh admin data
 */
export const useRefreshAdmin = (): (() => Promise<Admin | null>) => {
  const [, setAdmin] = useRecoilState(adminAtom);
  return () => fetchAdminProfile(setAdmin);
};

/**
 * Get admin ID from current admin state
 */
export const getAdminIdFromState = (admin: Admin | null): string | null => {
  if (!admin || !admin.id) {
    return null;
  }
  return admin.id;
};

/**
 * Hook to logout admin
 */
export const useAdminLogout = (): (() => void) => {
  const setAdmin = useSetRecoilState(adminAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const router = useRouter();

  return () => {
    // Reset deactivation tracking
    lastAdminDeactivationTime = 0;

    // Clear state
    setAdmin(null);
    setAccessToken(null);

    // Clear storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Redirect
    router.push("/");

    // Show message
    showApiSuccess("Đăng xuất thành công");
  };
};

/**
 * Hook to toggle admin status checking
 */
interface AdminStatusCheckReturn {
  enabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export const useAdminStatusCheck = (): AdminStatusCheckReturn => {
  const [enabled, setEnabled] = useRecoilState(adminStatusCheckEnabledAtom);

  return {
    enabled,
    toggle: () => setEnabled(!enabled),
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
  };
};

/**
 * Hook to check if current user is an admin
 */
export const useIsAdmin = (): boolean => {
  const admin = useAdminValue();
  return admin !== null && admin.role === "ADMIN";
};
