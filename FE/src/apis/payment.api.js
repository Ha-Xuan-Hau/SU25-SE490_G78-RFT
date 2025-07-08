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

/**
 * Các mã ngân hàng VNPay phổ biến
 */
export const VNPAY_BANK_CODES = {
    VNPAYQR: 'VNPAYQR',     // Thanh toán qua QR Code
    VNBANK: 'VNBANK',       // Thanh toán qua thẻ ATM/iBanking
    INTCARD: 'INTCARD',     // Thanh toán qua thẻ quốc tế
    VISA: 'VISA',           // Thẻ VISA
    MASTERCARD: 'MASTERCARD', // Thẻ MasterCard
    JCB: 'JCB',             // Thẻ JCB
};

/**
 * Trạng thái phản hồi từ VNPay
 */
export const VNPAY_RESPONSE_CODES = {
    SUCCESS: '00',          // Giao dịch thành công
    FAILED: '99',           // Giao dịch thất bại
    PENDING: '01',          // Giao dịch đang xử lý
    CANCELLED: '24',        // Giao dịch bị hủy
};
