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
import { User as Staff } from "@/types/user";
import { AxiosResponse } from "axios";

// Atoms
export const staffAtom = atom<Staff | null>({
  key: `staff_${Date.now()}`,
  default: null,
});

export const staffStatusCheckEnabledAtom = atom<boolean>({
  key: `staff_status_check_${Date.now()}`,
  default: true,
});

// Global flag to prevent multiple instances of polling
let isStaffPollingActive = false;
let lastStaffDeactivationTime = 0;

// Interface for API response
interface StaffApiResponse {
  data?: Staff;
  result?: Staff;
  status?: string;
  isActive?: boolean;
  role?: string;
}

/**
 * Fetch staff profile data from API
 */
export const fetchStaffProfile = async (
  setStaff: SetterOrUpdater<Staff | null>
): Promise<Staff | null> => {
  try {
    if (typeof window !== "undefined") {
      const value = window.localStorage.getItem("access_token");

      if (value !== null) {
        let token = value;
        if (token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        }

        const response: AxiosResponse<StaffApiResponse> =
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

        // Handle both response structures
        const userData = response.data?.result || response.data;

        if (userData) {
          // Check if user is staff
          if (userData.role === "STAFF") {
            // Check if staff is active
            if (userData.status === "INACTIVE") {
              throw new Error("ACCOUNT_DEACTIVATED");
            }

            setStaff(userData as Staff);
            return userData as Staff;
          } else {
            console.warn("User is not a staff member, access denied.");
            return null;
          }
        }
      }
    }
    return null;
  } catch (error: any) {
    if (
      error.message === "ACCOUNT_DEACTIVATED" ||
      error.response?.status === 403
    ) {
      setStaff(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      showApiError(error, "Tài khoản nhân viên đã bị vô hiệu hóa");
    } else {
      showApiError(error, "Không thể tải thông tin tài khoản nhân viên");
    }
    return null;
  }
};

/**
 * Check staff status from API
 */
const checkStaffStatus = async (staffId: string): Promise<Staff | null> => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token || !staffId) return null;

    let cleanToken = token;
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1);
    }

    const response: AxiosResponse<StaffApiResponse> = await apiClient.request({
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

    // Verify it's still staff
    if (userData?.role !== "STAFF") {
      throw new Error("NOT_STAFF");
    }

    return userData as Staff;
  } catch (error: any) {
    if (error.response?.status === 403 || error.message === "NOT_STAFF") {
      throw new Error("ACCOUNT_DEACTIVATED");
    }
    return null;
  }
};

/**
 * Hook to access and update staff state with status monitoring
 */
export const useStaffState = (): [
  Staff | null,
  SetterOrUpdater<Staff | null>
] => {
  const [staff, setStaff] = useRecoilState(staffAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const [statusCheckEnabled] = useRecoilState(staffStatusCheckEnabledAtom);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMainInstance = useRef<boolean>(false);

  // Initial load
  useEffect(() => {
    if (staff === null) {
      fetchStaffProfile(setStaff);
    }
  }, [staff, setStaff]);

  // Status monitoring with polling
  useEffect(() => {
    if (!isStaffPollingActive && staff?.id && statusCheckEnabled) {
      isStaffPollingActive = true;
      isMainInstance.current = true;
    }

    if (!isMainInstance.current || !staff?.id || !statusCheckEnabled) {
      return;
    }

    const handleStaffDeactivated = (): void => {
      const now = Date.now();
      if (now - lastStaffDeactivationTime < 5000) {
        return;
      }
      lastStaffDeactivationTime = now;

      // Clear staff state
      setStaff(null);
      setAccessToken(null);

      // Clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Show notification
      toast.error(
        "Tài khoản nhân viên của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản lý.",
        {
          position: "top-center",
          autoClose: 5000,
          toastId: "staff-deactivated",
        }
      );

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
    };

    const performStatusCheck = async (): Promise<void> => {
      try {
        const staffData = await checkStaffStatus(staff.id);

        if (!staffData) return;

        if (staffData.status === "INACTIVE" || staffData.role !== "STAFF") {
          handleStaffDeactivated();
        }
      } catch (error: any) {
        if (error.message === "ACCOUNT_DEACTIVATED") {
          handleStaffDeactivated();
        }
      }
    };

    // Setup polling
    const initialTimeout = setTimeout(performStatusCheck, 2000);
    intervalRef.current = setInterval(performStatusCheck, 10000);

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

      if (isMainInstance.current) {
        isStaffPollingActive = false;
        isMainInstance.current = false;
      }
    };
  }, [staff?.id, statusCheckEnabled, setStaff, setAccessToken, router]);

  return [staff, setStaff];
};

// Other hooks
export const useStaffValue = (): Staff | null => useRecoilValue(staffAtom);

export const useRefreshStaff = (): (() => Promise<Staff | null>) => {
  const [, setStaff] = useRecoilState(staffAtom);
  return () => fetchStaffProfile(setStaff);
};

export const getStaffIdFromState = (staff: Staff | null): string | null => {
  return staff?.id || null;
};

export const useStaffLogout = (): (() => void) => {
  const setStaff = useSetRecoilState(staffAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const router = useRouter();

  return () => {
    lastStaffDeactivationTime = 0;
    setStaff(null);
    setAccessToken(null);
    localStorage.clear();
    sessionStorage.clear();
    router.push("/");
    showApiSuccess("Đăng xuất thành công");
  };
};

export const useIsStaff = (): boolean => {
  const staff = useStaffValue();
  return staff !== null && staff.role === "STAFF";
};
