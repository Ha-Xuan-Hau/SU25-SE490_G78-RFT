import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}`,
    timeout: 1000,
});

// apiClient.interceptors.request.use(function (config) {
//   const token = localStorage.getItem("access_token");

//   if (!token) {
//     return config;
//   }

//   config.headers.Authorization = `Bearer ${token}`;

//   return config;
// });

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