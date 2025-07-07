import { atom, useRecoilState, useRecoilValue } from "recoil";
import { apiClient } from "../apis/client";
import { useEffect } from "react";
import { showApiError, showApiSuccess } from "../utils/toast.utils";

// Provider atom
export const providerAtom = atom({
    key: `provider_${Date.now()}`,
    default: null,
});

/**
 * Fetch provider profile data from API
 * @param {Function} setProvider - Function to update provider state
 * @returns {Promise<Object|null>} Provider data or null
 */
export const fetchProviderProfile = async (setProvider) => {
    try {
        if (typeof window !== "undefined") {
            const value = window.localStorage.getItem("access_token");
            console.log("Token from localStorage:", value);

            if (value !== null) {
                // Remove potential quotes around the token
                let token = value;
                if (token.startsWith('"') && token.endsWith('"')) {
                    token = token.slice(1, -1);
                }

                console.log("API request starting for provider...");
                console.log("Request URL:", `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/users/get-user`);

                const response = await apiClient.request({
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

                // Kiểm tra nếu user có role provider hoặc chỉ cần có user data
                // Trong trường hợp này, ta coi user cũng có thể là provider
                if (response.data) {
                    console.log("User role:", response.data.role);

                    if (response.data.role === 'PROVIDER') {
                        // Đúng role PROVIDER thì gán vào state provider
                        setProvider(response.data);
                        return response.data;
                    } else {
                        console.warn("User is not a provider, access denied.");
                        return null; // Hoặc redirect / show error / throw exception tùy yêu cầu
                    }
                } else {
                    console.warn("No user data returned");
                    return null;
                }

            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching provider profile:", {
            message: error.message,
            response: error.response,
            request: error.request,
            config: error.config
        });

        // Show error toast with proper message extraction
        showApiError(error, "Không thể tải thông tin tài khoản provider");

        return null;
    }
};

/**
 * Hook to access and update provider state
 * @returns {Array} [provider, setProvider] - Provider object and setter function
 */
export const useProviderState = () => {
    const [provider, setProvider] = useRecoilState(providerAtom);

    useEffect(() => {
        if (provider === null) {
            fetchProviderProfile(setProvider);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider]); // Remove setProvider from dependencies to prevent unnecessary re-runs

    return [provider, setProvider];
};

/**
 * Hook to access provider state without setter
 * @returns {Object|null} Provider object or null
 */
export const useProviderValue = () => useRecoilValue(providerAtom);

/**
 * Hook to manually refresh provider data
 * @returns {Function} Function to trigger provider data refresh
 */
export const useRefreshProvider = () => {
    const [, setProvider] = useRecoilState(providerAtom);

    return () => fetchProviderProfile(setProvider);
};

/**
 * Get provider ID from current provider state
 * @param {Object|null} provider - Provider object
 * @returns {string|null} Provider ID or null
 */
export const getProviderIdFromState = (provider) => {
    if (!provider || !provider.id) {
        return null;
    }
    return provider.id;
};
