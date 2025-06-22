import { atom, useRecoilState, useRecoilValue } from "recoil";
import { apiClient } from "../apis/client";
import { useEffect } from "react";

// Use plain JavaScript atom
export const userAtom = atom({
  key: `user_${Date.now()}`,
  default: null,
});

/**
 * Fetch user profile data from API
 * @param {Function} setUser - Function to update user state
 * @returns {Promise<Object|null>} User data or null
 */
export const fetchUserProfile = async (setUser) => {
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

        console.log("API request starting...");
        console.log("Request URL:", `${process.env.NEXT_PUBLIC_API_URL}/users/get-user`);

        const response = await apiClient.request({
          method: "GET",
          url: "/users/get-user",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // Try without withCredentials first
          withCredentials: false,
          // Add timeout
          timeout: 10000,
        });

        console.log("API response:", response);
        setUser(response.data);
        return response.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config
    });
    return null;
  }
};

/**
 * Hook to access and update user state
 * @returns {Array} [user, setUser] - User object and setter function
 */
export const useUserState = () => {
  const [user, setUser] = useRecoilState(userAtom);

  useEffect(() => {
    if (user === null) {
      fetchUserProfile(setUser);
    }
  }, [user, setUser]);

  return [user, setUser];
};

/**
 * Hook to access user state without setter
 * @returns {Object|null} User object or null
 */
export const useUserValue = () => useRecoilValue(userAtom);

/**
 * Hook to manually refresh user data
 * @returns {Function} Function to trigger user data refresh
 */
export const useRefreshUser = () => {
  const [, setUser] = useRecoilState(userAtom);

  return () => fetchUserProfile(setUser);
};