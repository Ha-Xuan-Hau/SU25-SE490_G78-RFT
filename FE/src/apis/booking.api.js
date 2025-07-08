import { apiClient } from './client';

/**
 * Tạo booking mới (chưa thanh toán)
 * @param {Object} bookingData - Dữ liệu đặt xe
 * @returns {Promise<Object>} Response chứa thông tin booking đã tạo
 */
export const createBooking = async (bookingData) => {
    try {
        console.log('Sending booking request:', bookingData);

        const response = await apiClient.post('/bookings', bookingData);

        return {
            success: true,
            data: {
                id: response.data.id,
                vehicleId: response.data.vehicleId,
                totalCost: response.data.totalCost,
                status: response.data.status,
                timeBookingStart: response.data.timeBookingStart,
                timeBookingEnd: response.data.timeBookingEnd,
                couponId: response.data.couponId,
                discountAmount: response.data.discountAmount,
                message: response.data.message || 'Tạo đơn đặt xe thành công'
            }
        };
    } catch (error) {
        console.error('Error creating booking:', error);

        // Check for conflict errors (409 status or specific messages)
        const isConflictError =
            error.response?.status === 409 ||
            error.response?.data?.message?.includes('đã được đặt') ||
            error.response?.data?.message?.includes('CONFLICT') ||
            error.message?.includes('đã được đặt');

        const errorMessage = error.response?.data?.message || error.message;

        return {
            success: false,
            error: errorMessage,
            isConflict: isConflictError,
            statusCode: error.response?.status
        };
    }
};

/**
 * Thanh toán bằng ví hệ thống
 * @param {string} bookingId - ID đơn đặt xe
 * @returns {Promise<Object>} Kết quả thanh toán
 */
export const payWithWallet = async (bookingId) => {
    try {
        console.log('Processing wallet payment for booking:', bookingId);

        const response = await apiClient.post(`/bookings/${bookingId}/pay-wallet`);

        return {
            success: true,
            data: {
                bookingId: response.data.bookingId,
                status: response.data.status,
                paymentMethod: 'WALLET',
                paymentStatus: response.data.paymentStatus,
                message: response.data.message || 'Thanh toán ví thành công'
            }
        };
    } catch (error) {
        console.error('Error processing wallet payment:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Tạo link thanh toán VNPay
 * @param {string} bookingId - ID đơn đặt xe
 * @param {string} bankCode - Mã ngân hàng (optional)
 * @returns {Promise<Object>} Response chứa paymentUrl
 */
export const createVNPayPayment = async (bookingId, bankCode = '') => {
    try {
        console.log('Creating VNPay payment for booking:', bookingId);

        // Lấy thông tin booking để có amount
        const bookingInfo = await getBookingById(bookingId);

        const paymentData = {
            amount: bookingInfo.totalCost,
            bookingId: bookingId,
            bankCode: bankCode,
        };

        const response = await apiClient.post('/payment/vn-pay', paymentData);

        return {
            success: true,
            data: {
                bookingId: bookingId,
                paymentUrl: response.data.paymentUrl,
                code: response.data.code,
                message: response.data.message || 'Tạo link thanh toán VNPay thành công'
            }
        };
    } catch (error) {
        console.error('Error creating VNPay payment:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Lấy thông tin booking theo ID
 * @param {string} bookingId - ID đơn đặt xe
 * @returns {Promise<Object>} Thông tin booking
 */
export const getBookingById = async (bookingId) => {
    try {
        const response = await apiClient.get(`/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching booking:', error);
        throw new Error(`Lỗi lấy thông tin booking: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Lấy danh sách booking của user
 * @param {string} userId - ID người dùng
 * @param {string} status - Trạng thái booking (optional)
 * @returns {Promise<Object>} Danh sách booking
 */
export const getUserBookings = async (userId, status = null) => {
    try {
        const url = status
            ? `/bookings/user/${userId}/status/${status}`
            : `/bookings/user/${userId}`;

        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        throw new Error(`Lỗi lấy danh sách booking: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Cập nhật trạng thái booking
 * @param {string} bookingId - ID đơn đặt xe
 * @param {string} action - Hành động (confirm, deliver, receive, return, complete, cancel)
 * @param {Object} additionalData - Dữ liệu bổ sung (optional)
 * @returns {Promise<Object>} Kết quả cập nhật
 */
export const updateBookingStatus = async (bookingId, action, additionalData = {}) => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/${action}`, additionalData);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error(`Error updating booking status (${action}):`, error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Hủy booking
 * @param {string} bookingId - ID đơn đặt xe
 * @param {string} reason - Lý do hủy
 * @returns {Promise<Object>} Kết quả hủy booking
 */
export const cancelBooking = async (bookingId, reason = '') => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/cancel`, {
            reason: reason
        });

        return {
            success: true,
            data: {
                bookingId: bookingId,
                status: response.data.status,
                refundAmount: response.data.refundAmount,
                penaltyAmount: response.data.penaltyAmount,
                message: response.data.message || 'Hủy đơn đặt xe thành công'
            }
        };
    } catch (error) {
        console.error('Error canceling booking:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Kiểm tra trạng thái thanh toán VNPay
 * @param {Object} vnpayParams - Tham số callback từ VNPay
 * @returns {Promise<Object>} Kết quả kiểm tra thanh toán
 */
export const verifyVNPayPayment = async (vnpayParams) => {
    try {
        const response = await apiClient.post('/payment/vn-pay/callback', vnpayParams);

        return {
            success: true,
            data: {
                bookingId: response.data.bookingId,
                paymentStatus: response.data.paymentStatus,
                transactionId: response.data.transactionId,
                message: response.data.message
            }
        };
    } catch (error) {
        console.error('Error verifying VNPay payment:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Kiểm tra tính khả dụng của xe trong khoảng thời gian
 * @param {string} vehicleId - ID xe
 * @param {string} startTime - Thời gian bắt đầu (yyyy-MM-dd'T'HH:mm:ss format, giờ VN)
 * @param {string} endTime - Thời gian kết thúc (yyyy-MM-dd'T'HH:mm:ss format, giờ VN)
 * @returns {Promise<Object>} Kết quả kiểm tra
 */
export const checkAvailability = async (vehicleId, startTime, endTime) => {
    try {
        console.log('Checking availability for:', { vehicleId, startTime, endTime });

        const response = await apiClient.post('/bookings/check-availability', {
            vehicleId,
            startTime,
            endTime
        });

        return {
            success: true,
            data: {
                available: response.data.available,
                message: response.data.message
            }
        };
    } catch (error) {
        console.error('Error checking availability:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            available: false
        };
    }
};