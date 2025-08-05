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

export const updateUserWallet = async (userId, card) => {
    try {
        // Use query parameter to match backend @RequestParam
        const payload = {
            userId,
            bankAccountNumber: card.bankAccountNumber,
            bankAccountName: card.bankAccountName,
            bankAccountType: card.bankAccountType,
        };
        const res = await apiClient.put("/wallet/account", payload);
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }

};

export const withdrawFromWallet = async ({ userId, amount }) => {
    try {
        const res = await apiClient.post("/wallet/withdrawals", { userId, amount });
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};
