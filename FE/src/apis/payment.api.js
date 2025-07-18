import { apiClient } from './client';

/**
 * Tạo link thanh toán VNPay
 * @param {Object} paymentData - Dữ liệu thanh toán
 * @param {number} paymentData.amout - Số tiền thanh toán (VND)
 * @param {string} paymentData.bankCode - Mã ngân hàng (tùy chọn)
 * @param {string} paymentData.bookingId - ID đơn đặt xe
 * @returns {Promise<Object>} Response chứa paymentUrl
 */
export const createVNPayPayment = async (paymentData) => {
    try {
        const response = await apiClient.post('/payment/vn-pay', paymentData);
        return response.data;
    } catch (error) {
        throw new Error(`Lỗi tạo thanh toán VNPay: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Xử lý callback từ VNPay sau khi thanh toán
 * @param {Object} callbackParams - Parameters từ VNPay callback
 * @returns {Promise<Object>} Kết quả xử lý callback
 */
export const handleVNPayCallback = async (callbackParams) => {
    try {
        const queryString = new URLSearchParams(callbackParams).toString();
        const response = await apiClient.get(`/payment/vn-pay-callback?${queryString}`);
        return response.data;
    } catch (error) {
        throw new Error(`Lỗi xử lý callback VNPay: ${error.response?.data?.message || error.message}`);
    }
};



// Gọi API tạo link thanh toán VNPay (top up)
export const createTopUpVNPay = async (paymentData) => {
    try {
        const response = await apiClient.post('/payment/topUp', paymentData);
        return response.data; // { code, message, paymentUrl }
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};

// Gọi API callback sau khi thanh toán thành công
export const handleTopUpCallback = async (callbackParams) => {
    try {
        const queryString = new URLSearchParams(callbackParams).toString();
        const response = await apiClient.get(`/payment/topUpCallBack?${queryString}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};