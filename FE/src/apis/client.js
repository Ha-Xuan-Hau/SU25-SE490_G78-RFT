import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}`,
    timeout: 10000,
});

// apiClient.interceptors.request.use(function (config) {
//   const token = localStorage.getItem("access_token");

//   if (!token) {
//     return config;
//   }

//   config.headers.Authorization = `Bearer ${token}`;

//   return config;
// });

apiClient.interceptors.request.use(function (config) {
    try {
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

    return config;
});

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnmount: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 0,
        },
    },
});