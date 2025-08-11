import { apiClient } from './client';

export async function getCoupons(userId) {
    try {
        const { data } = await apiClient.request({
            method: 'GET',
            url: '/coupons/available',
            params: {
                userId: userId
            }
        });

        return Array.isArray(data) ? data : data.content || data.items || data.data || [];
    } catch (error) {
        // console.error("Error fetching coupons:", error);
        throw error;
    }
}

export const getAllCoupons = async () => {
    try {
        const { data } = await apiClient.get('/coupons'); // Lấy tất cả coupon
        return data;
    } catch (error) {
        // console.error("Error fetching coupons:", error);
        throw error;
    }
};

export async function getCouponById(couponId) {
    try {
        const { data } = await apiClient.request({
            method: 'GET',
            url: `/coupons/${couponId}`,
        });

        return data;
    } catch (error) {
        // console.error("Error fetching coupon details:", error);
        throw error;
    }
}

export const updateCoupon = async (couponId, couponData) => {
    try {
        const { data } = await apiClient.put(`/coupons/${couponId}`, couponData); // Cập nhật coupon
        return data;
    } catch (error) {
        // console.error("Error updating coupon:", error);
        throw error;
    }
};

export const createCoupon = async (couponData) => {
    try {
        const { data } = await apiClient.post('/coupons/admin/create', couponData); // Tạo coupon mới
        return data;
    } catch (error) {
        // console.error("Error creating coupon:", error);
        throw error;
    }
};