import { apiClient } from './client';

/**
 * Lấy chi tiết booking theo bookingId
 * @param {string} bookingId - ID đơn đặt xe
 * @returns {Promise<Object>} Thông tin chi tiết booking
 */
export const getBookingDetail = async (bookingId) => {
    try {
        const response = await apiClient.get(`/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        ////  console.error('Error fetching booking detail:', error);
        throw new Error(`Lỗi lấy chi tiết booking: ${error.response?.data?.message || error.message}`);
    }
};

/**
 * Tạo booking mới (chưa thanh toán)
 * @param {Object} bookingData - Dữ liệu đặt xe
 * @returns {Promise<Object>} Response chứa thông tin booking đã tạo
 */
export const createBooking = async (bookingData) => {
    try {
        ////  console.log('Sending booking request:', bookingData);

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
        ////  console.error('Error creating booking:', error);

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
        ////  console.log('Paying with wallet for booking:', bookingId);

        const response = await apiClient.post(`/bookings/${bookingId}/pay-wallet`);

        return {
            success: true,
            data: {
                bookingId: bookingId,
                paymentMethod: 'WALLET',
                paymentStatus: 'SUCCESS',
                message: response.data.message || 'Thanh toán ví thành công'
            }
        };
    } catch (error) {
        ////  console.error('Error paying with wallet:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Tạo link thanh toán VNPay
 * @param {string} bookingId - ID của booking cần thanh toán
 * @returns {Promise<Object>} Response chứa URL thanh toán VNPay
 */
export const createVNPayPayment = async (bookingId, amount) => {
    try {
        ////  console.log('Creating VNPay payment for booking:', bookingId);

        const response = await apiClient.post(`/payment/vn-pay`, {
            bookingId: bookingId, amount: amount
        });

        return {
            success: true,
            data: {
                bookingId: bookingId,
                paymentMethod: 'VNPAY',
                paymentUrl: response.data.paymentUrl,
                message: 'Tạo link thanh toán VNPay thành công'
            }
        };
    } catch (error) {
        ////  console.error('Error creating VNPay payment:', error);
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
        //  console.error('Error fetching booking:', error);
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
        // ////  console.error('Error fetching user bookings:', error);
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
        ////  console.error(`Error updating booking status (${action}):`, error);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Hủy booking với lý do chi tiết và tạo final contract
 * @param {string} bookingId - ID đơn đặt xe
 * @param {string} reason - Lý do hủy chi tiết
 * @param {string} userType - Loại người dùng: "USER" hoặc "PROVIDER"
 * @returns {Promise<Object>} Kết quả hủy booking
 */
export const cancelBooking = async (bookingId, reason = '', userType = 'USER') => {
    try {
        // Map frontend user types to backend enum values
        const backendUserType = userType === 'customer' ? 'USER' :
            userType === 'provider' ? 'PROVIDER' :
                userType; // Use as-is if already correct

        const response = await apiClient.post(`/bookings/${bookingId}/cancel`, {
            reason: reason,
            userType: backendUserType,
            createFinalContract: true // Flag để backend biết cần tạo final contract
        });

        return {
            success: true,
            data: {
                bookingId: bookingId,
                status: response.data.status,
                contractStatus: response.data.contractStatus,
                finalContractId: response.data.finalContractId,
                refundAmount: response.data.refundAmount,
                penaltyAmount: response.data.penaltyAmount,
                reason: reason,
                message: response.data.message || 'Hủy đơn đặt xe thành công'
            }
        };
    } catch (error) {
        ////  console.error('Error canceling booking:', error);
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
        ////  console.error('Error verifying VNPay payment:', error);
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
        ////  console.log('Checking availability for:', { vehicleId, startTime, endTime });

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
        ////  console.error('Error checking availability:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            available: false
        };
    }
};

/**
 * Lấy thông tin số dư ví của user
 * @returns {Promise<Object>} Response chứa số dư ví
 */
export const getWalletBalance = async () => {
    try {
        const response = await apiClient.get('/wallets/balance');

        return {
            success: true,
            data: {
                balance: response.data.balance || 0
            }
        };
    } catch (error) {
        ////  console.error('Error getting wallet balance:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            data: { balance: 0 }
        };
    }
};

/**
 * Cập nhật trạng thái booking trực tiếp
 * @param {string} bookingId - ID của booking
 * @param {string} status - Trạng thái mới (CONFIRMED, CANCELLED, etc.)
 * @returns {Promise<Object>} Response sau khi cập nhật
 */
export const updateBookingStatusDirect = async (bookingId, status) => {
    try {
        const response = await apiClient.put(`/bookings/${bookingId}`, {
            status: status
        });

        return {
            success: true,
            data: response.data,
            message: 'Cập nhật trạng thái đơn đặt xe thành công'
        };
    } catch (error) {
        ////  console.error('Error updating booking status:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Xác nhận đơn đặt xe bởi provider
 * @param {string} bookingId - ID của booking cần xác nhận
 * @returns {Promise<Object>} Response sau khi xác nhận
 */
export const confirmBookingByProvider = async (bookingId) => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/confirm`);

        return {
            success: true,
            data: response.data,
            message: 'Xác nhận đơn đặt xe thành công'
        };
    } catch (error) {
        ////  console.error('Error confirming booking:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Lấy danh sách booking theo providerId và status
 * @param {string} providerId - ID của provider
 * @param {string} status - Status của booking (PENDING, CONFIRMED, etc.)
 * @returns {Promise<Object>} Response chứa danh sách bookings
 */
export const getBookingsByProviderAndStatus = async (providerId, status) => {
    try {
        const response = await apiClient.get(`/bookings/provider/${providerId}/status/${status}`);

        // Kiểm tra và trả về data đúng format
        if (response.data && response.data.content) {
            // Nếu API trả về format phân trang
            return response.data.content;
        }

        // Nếu API trả về array trực tiếp
        return response.data;
    } catch (error) {
        ////  console.error('Error fetching provider bookings:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};


/**
 * Hủy đơn đặt xe bởi provider
 * @param {string} bookingId - ID của booking cần hủy
 * @param {string} reason - Lý do hủy (optional)
 * @returns {Promise<Object>} Response sau khi hủy
 */
export const cancelBookingByProvider = async (bookingId, reason = '') => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/cancel`, {
            reason: reason,
            userType: 'PROVIDER',
            createFinalContract: true
        });

        return {
            success: true,
            data: response.data,
            message: 'Hủy đơn đặt xe thành công'
        };
    } catch (error) {
        ////  console.error('Error cancelling booking:', error);

        return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode: error.response?.status
        };
    }
};

/**
 * Lấy rating của 1 booking theo user
 * @param {string} bookingId
 * @param {string} userId
 */
export const getRatingByBookingAndUser = async (bookingId, userId) => {
    try {
        const res = await apiClient.get(`/ratings/user/${userId}`);
        // res.data là mảng rating, lọc theo bookingId
        return res.data.find(rating => rating.bookingId === bookingId) || null;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};

/**
 * Tạo mới hoặc cập nhật rating cho booking
 * @param {Object} payload { bookingId, carId, userId, star, comment }
 */
export const upUserRating = async (payload) => {
    try {
        // Nếu backend hỗ trợ PUT/PATCH cho update, dùng PUT, nếu không thì POST
        const res = await apiClient.post('/ratings', payload);
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};

/**
 * Hủy booking do khách không xuất hiện (Provider)
 * @param {string} bookingId - ID đơn đặt xe
 * @returns {Promise<Object>} Kết quả hủy booking
 */
export const cancelBookingByProviderDueToNoShow = async (bookingId) => {
    try {
        const response = await apiClient.post(`/bookings/${bookingId}/cancel/no-show`);
        return response.data;
    } catch (error) {
        ////  console.error('Error canceling booking due to no-show:', error);
        throw new Error(`Lỗi hủy đơn do khách không xuất hiện: ${error.response?.data?.message || error.message}`);
    }
};
