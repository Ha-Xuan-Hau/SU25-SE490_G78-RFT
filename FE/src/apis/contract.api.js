import { apiClient } from './client';

/**
 * Lấy danh sách hợp đồng theo providerId và status
 * @param {string} providerId - ID của provider
 * @param {string} status - Status của contract (PROCESSING, RENTING, FINISHED, CANCELLED)
 * @returns {Promise<Object>} Response chứa danh sách contracts
 */
export const getContractsByProviderAndStatus = async (providerId, status) => {
    try {
        const response = await apiClient.get(`/contracts/provider/${providerId}/status/${status}`);

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        // console.error('Error fetching contracts:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Lấy tất cả FinalContract theo providerId
 * @param {string} providerId - ID của provider
 * @returns {Promise<Object>} Response chứa danh sách final contracts
 */
export const getFinalContractsByProvider = async (providerId) => {
    try {
        const response = await apiClient.get(`/final-contracts/user/${providerId}`);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        // console.error('Error fetching final contracts:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Cập nhật status của contract
 * @param {string} contractId - ID của contract
 * @param {string} status - Status mới (PROCESSING, RENTING, FINISHED, CANCELLED)
 * @returns {Promise<Object>} Response sau khi cập nhật
 */
export const updateContractStatus = async (contractId, status) => {
    try {
        const response = await apiClient.put(`/contracts/${contractId}`, {
            status: status
        });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật trạng thái hợp đồng thành công'
        };
    } catch (error) {
        // console.error('Error updating contract status:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Lấy chi tiết contract theo ID
 * @param {string} contractId - ID của contract
 * @returns {Promise<Object>} Response chứa thông tin contract
 */
export const getContractById = async (contractId) => {
    try {
        const response = await apiClient.get(`/contracts/${contractId}`);

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        // console.error('Error fetching contract details:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Tạo FinalContract khi tất toán hợp đồng
 * @param {Object} data - Dữ liệu tất toán (bookingId, cost_settlement, note, timeFinish, ...)
 * @returns {Promise<Object>} Response sau khi tạo FinalContract
 */
export const createFinalContract = async (data) => {
    try {
        const response = await apiClient.post('/final-contracts', data);
        return {
            success: true,
            data: response.data,
            message: 'Tạo hợp đồng tất toán thành công'
        };
    } catch (error) {
        // console.error('Error creating final contract:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Lấy chi tiết FinalContract theo ID
 * @param {string} finalContractId - ID của final contract
 * @returns {Promise<Object>} Response chứa thông tin final contract
 */
export const getFinalContractById = async (finalContractId) => {
    try {
        const response = await apiClient.get(`/final-contracts/${finalContractId}`);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        // console.error('Error fetching final contract details:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};