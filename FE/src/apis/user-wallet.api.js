import { apiClient } from "./client.js";

export const getUserWallet = async (userId) => {
    try {
        // Use query parameter to match backend @RequestParam
        const url = `/wallet/account?userId=${userId}`;

        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching user wallet:', error);
        throw new Error(`Lỗi lấy ví người dùng: ${error.response?.data?.message || error.message}`);
    }
};