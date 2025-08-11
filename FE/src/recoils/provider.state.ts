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
import { User as Provider } from "@/types/user";
import { AxiosResponse } from "axios";

// Atoms
export const providerAtom = atom<Provider | null>({
  key: `provider_${Date.now()}`,
  default: null,
});

export const providerStatusCheckEnabledAtom = atom<boolean>({
  key: `provider_status_check_${Date.now()}`,
  default: true,
});

// Global flag to prevent multiple instances of polling
let isProviderPollingActive = false;
let lastProviderDeactivationTime = 0;

// Interface for API response
interface ProviderApiResponse {
  data?: Provider;
  result?: Provider;
  status?: string;
  isActive?: boolean;
  role?: string;
}

/**
 * Fetch provider profile data from API
 */
export const fetchProviderProfile = async (
  setProvider: SetterOrUpdater<Provider | null>
): Promise<Provider | null> => {
  try {
    if (typeof window !== "undefined") {
      const value = window.localStorage.getItem("access_token");
      console.log("Token from localStorage:", value);

      if (value !== null) {
        let token = value;
        if (token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        }

        console.log("API request starting for provider...");

        const response: AxiosResponse<ProviderApiResponse> =
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

        console.log("Provider API response:", response);

        // Handle both response structures
        const userData = response.data?.result || response.data;

        if (userData) {
          console.log("User role:", userData.role);

          // Check if user is a provider
          if (userData.role === "PROVIDER") {
            // Check if provider is active
            if (userData.status === "INACTIVE") {
              throw new Error("ACCOUNT_DEACTIVATED");
            }

            setProvider(userData as Provider);
            return userData as Provider;
          } else {
            console.warn("User is not a provider, access denied.");
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
    console.error("Error fetching provider profile:", {
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
      setProvider(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      showApiError(error, "Tài khoản provider đã bị vô hiệu hóa");
    } else {
      showApiError(error, "Không thể tải thông tin tài khoản provider");
    }

    return null;
  }
};

/**
 * Check provider status from API
 */
const checkProviderStatus = async (
  providerId: string
): Promise<Provider | null> => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token || !providerId) return null;

    let cleanToken = token;
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1);
    }

    const response: AxiosResponse<ProviderApiResponse> =
      await apiClient.request({
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

    // Verify it's still a provider
    if (userData?.role !== "PROVIDER") {
      throw new Error("NOT_PROVIDER");
    }

    return userData as Provider;
  } catch (error: any) {
    console.error("Error checking provider status:", error);
    if (error.response?.status === 403 || error.message === "NOT_PROVIDER") {
      throw new Error("ACCOUNT_DEACTIVATED");
    }
    return null;
  }
};

/**
 * Hook to access and update provider state with status monitoring
 */
export const useProviderState = (): [
  Provider | null,
  SetterOrUpdater<Provider | null>
] => {
  const [provider, setProvider] = useRecoilState(providerAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const [statusCheckEnabled] = useRecoilState(providerStatusCheckEnabledAtom);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMainInstance = useRef<boolean>(false);

  // Initial load
  useEffect(() => {
    if (provider === null) {
      fetchProviderProfile(setProvider);
    }
  }, [provider, setProvider]);

  // Status monitoring with polling - ONLY ONE INSTANCE
  useEffect(() => {
    // Check if this should be the main polling instance
    if (!isProviderPollingActive && provider?.id && statusCheckEnabled) {
      isProviderPollingActive = true;
      isMainInstance.current = true;
      console.log("Provider polling instance started");
    }

    // Only proceed if this is the main instance
    if (!isMainInstance.current || !provider?.id || !statusCheckEnabled) {
      return;
    }

    const handleProviderDeactivated = (): void => {
      // Prevent duplicate handling within 5 seconds
      const now = Date.now();
      if (now - lastProviderDeactivationTime < 5000) {
        console.log(
          "Provider deactivation already handled recently, skipping..."
        );
        return;
      }
      lastProviderDeactivationTime = now;

      console.log("Provider account deactivated, logging out...");

      // Clear provider state
      setProvider(null);
      setAccessToken(null);

      // Clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      // Show notification with unique ID
      toast.error(
        "Tài khoản nhà cung cấp của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin để biết thêm chi tiết.",
        {
          position: "top-center",
          autoClose: 5000,
          toastId: "provider-deactivated",
        }
      );

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
    };

    const performStatusCheck = async (): Promise<void> => {
      try {
        const providerData = await checkProviderStatus(provider.id);

        if (!providerData) return;

        // Check various deactivation conditions
        if (
          providerData.status === "INACTIVE" ||
          providerData.role !== "PROVIDER"
        ) {
          handleProviderDeactivated();
        }
      } catch (error: any) {
        if (error.message === "ACCOUNT_DEACTIVATED") {
          handleProviderDeactivated();
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
        isProviderPollingActive = false;
        isMainInstance.current = false;
        console.log("Provider polling instance cleaned up");
      }
    };
  }, [provider?.id, statusCheckEnabled, setProvider, setAccessToken, router]);

  return [provider, setProvider];
};

/**
 * Hook to access provider state without setter
 */
export const useProviderValue = (): Provider | null =>
  useRecoilValue(providerAtom);

/**
 * Hook to manually refresh provider data
 */
export const useRefreshProvider = (): (() => Promise<Provider | null>) => {
  const [, setProvider] = useRecoilState(providerAtom);
  return () => fetchProviderProfile(setProvider);
};

/**
 * Get provider ID from current provider state
 */
export const getProviderIdFromState = (
  provider: Provider | null
): string | null => {
  if (!provider || !provider.id) {
    return null;
  }
  return provider.id;
};

/**
 * Hook to logout provider
 */
export const useProviderLogout = (): (() => void) => {
  const setProvider = useSetRecoilState(providerAtom);
  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const router = useRouter();

  return () => {
    // Reset deactivation tracking
    lastProviderDeactivationTime = 0;

    // Clear state
    setProvider(null);
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
 * Hook to toggle provider status checking
 */
interface ProviderStatusCheckReturn {
  enabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export const useProviderStatusCheck = (): ProviderStatusCheckReturn => {
  const [enabled, setEnabled] = useRecoilState(providerStatusCheckEnabledAtom);

  return {
    enabled,
    toggle: () => setEnabled(!enabled),
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
  };
};

/**
 * Hook to check if current user is a provider
 */
export const useIsProvider = (): boolean => {
  const provider = useProviderValue();
  return provider !== null && provider.role === "PROVIDER";
};
