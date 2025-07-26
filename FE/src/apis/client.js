import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}`,
    timeout: 10000,
});

apiClient.interceptors.request.use(function (config) {
    try {
        // List of public endpoints that don't need authorization
        const publicEndpoints = [
            '/vehicles',
            '/vehicles/detail',
            '/vehicles/search',
            '/bookedTimeSlot/vehicle'
        ];

        // Check if the current request URL matches any public endpoint
        const isPublicEndpoint = publicEndpoints.some(endpoint =>
            config.url === endpoint || config.url?.startsWith(`${endpoint}/`)
        );

        // Skip adding authorization header for public endpoints
        if (isPublicEndpoint) {
            return config;
        }

        const tokenStr = localStorage.getItem("access_token");

        if (!tokenStr) {
            return config;
        }

        // Parse token nếu đã được stringify
        let token;
        try {
            token = JSON.parse(tokenStr);
        } catch {
            token = tokenStr; // Nếu không parse được, sử dụng nguyên bản
        }

        config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
        console.error("Error adding auth token:", error);
    }

    // Make sure we always return the config object
    return config;
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 0,
            gcTime: 300000, // Thay thế cacheTime bằng gcTime trong v5
        },
    },
});
