import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}`,
    timeout: 10000,
});

// Request interceptor 
apiClient.interceptors.request.use(function (config) {
    try {
        const publicEndpoints = [
            '/vehicles',
            '/vehicles/detail',
            '/vehicles/search',
            '/bookedTimeSlot/vehicle'
        ];

        const isPublicEndpoint = publicEndpoints.some(endpoint =>
            config.url === endpoint || config.url?.startsWith(`${endpoint}/`)
        );

        if (isPublicEndpoint) {
            return config;
        }

        const tokenStr = localStorage.getItem("access_token");

        if (!tokenStr) {
            return config;
        }

        let token;
        try {
            token = JSON.parse(tokenStr);
        } catch {
            token = tokenStr;
        }

        config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
        // console.error("Error adding auth token:", error);
    }

    return config;
});

// Response Interceptor để xử lý lỗi im lặng
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Chỉ reject error để component xử lý
        return Promise.reject(error);
    }
);

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 0,
            gcTime: 300000,
        },
    },
});
