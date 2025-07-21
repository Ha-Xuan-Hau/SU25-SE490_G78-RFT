import { atom, useRecoilState, useRecoilValue } from "recoil";
import { apiClient } from "../apis/client";
import { useEffect } from "react";
import { showApiError, showApiSuccess } from "../utils/toast.utils";

// admin atom
export const adminAtom = atom({
    key: `admin_${Date.now()}`,
    default: null,
});

/**
 * Fetch admin profile data from API
 * @param {Function} setProvider - Function to update admin state
 * @returns {Promise<Object|null>} admin data or null
 */
export const fetchAdminProfile = async (setAdmin) => {
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

                console.log("API request starting for admin...");
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

                console.log("admin API response:", response);

                // Kiểm tra nếu user có role admin hoặc chỉ cần có user data
                // Trong trường hợp này, ta coi user cũng có thể là admin
                if (response.data) {
                    console.log("User role:", response.data.role);

                    if (response.data.role === 'ADMIN') {
                        // Đúng role admin thì gán vào state admin
                        setAdmin(response.data);
                        return response.data;
                    } else {
                        console.warn("User is not a admin, access denied.");
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
        console.error("Error fetching admin profile:", {
            message: error.message,
            response: error.response,
            request: error.request,
            config: error.config
        });

        // Show error toast with proper message extraction
        showApiError(error, "Không thể tải thông tin tài khoản admin");

        return null;
    }
};

/**
 * Hook to access and update admin state
 * @returns {Array} [admin, setProvider] - admin object and setter function
 */
export const useProviderState = () => {
    const [admin, setProvider] = useRecoilState(providerAtom);

    useEffect(() => {
        if (admin === null) {
            fetchProviderProfile(setProvider);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admin]); // Remove setProvider from dependencies to prevent unnecessary re-runs

    return [admin, setProvider];
};

/**
 * Hook to access admin state without setter
 * @returns {Object|null} admin object or null
 */
export const useProviderValue = () => useRecoilValue(providerAtom);

/**
 * Hook to manually refresh admin data
 * @returns {Function} Function to trigger admin data refresh
 */
export const useRefreshAdmin = () => {
    const [, setAdmin] = useRecoilState(adminAtom);

    return () => fetchAdminProfile(setAdmin);
};

/**
 * Get admin ID from current admin state
 * @param {Object|null} admin - admin object
 * @returns {string|null} admin ID or null
 */
export const getAdminIdFromState = (admin) => {
    if (!admin || !admin.id) {
        return null;
    }
    return admin.id;
};
