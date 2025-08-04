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

/**
 * Lấy tất cả yêu cầu rút tiền dựa trên trạng thái
 * @param {string} status
 * @returns {Promise<Array>} Danh sách yêu cầu rút tiền
 */
export const getAllWithdrawals = async (status) => {
    try {
        const response = await apiClient.get(`/wallet/staff/withdrawals`, {
            params: { status } // Use query parameters for status
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        throw new Error(`Lỗi lấy yêu cầu rút tiền: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Lấy tất cả yêu cầu rút tiền dựa trên trạng thái
 * @param {string} status
 * @returns {Promise<Array>} Danh sách yêu cầu rút tiền
 */
export const getApprovedWithdrawals = async () => {
    try {
        const response = await apiClient.get(`/wallet/staff/withdrawals/approved`);
        return response.data;
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        throw new Error(`Lỗi lấy yêu cầu rút tiền: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Lấy thông tin chi tiết yêu cầu rút tiền theo ID
 * @param {string} id
 * @returns {Promise<Object>} Thông tin yêu cầu rút tiền
 */
export const getWithdrawalDetail = async (id) => {
    try {
        const response = await apiClient.get(`/wallet/staff/withdrawals/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching withdrawal detail:', error);
        throw new Error(`Lỗi lấy thông tin yêu cầu rút tiền: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Cập nhật trạng thái yêu cầu rút tiền
 * @param {string} id
 * @param {string} status
 * @returns {Promise<void>} 
 */
export const updateWithdrawalStatus = async (id, status) => {
    try {
        await apiClient.put(`/wallet/staff/withdrawals/${id}/status`, null, {
            params: { status } // Send status as a query parameter
        });
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        throw new Error(`Lỗi cập nhật trạng thái yêu cầu rút tiền: ${error.response?.data?.message || error.message}`);
    }
};