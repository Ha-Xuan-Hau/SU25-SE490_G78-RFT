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
        console.error("Error fetching coupons:", error);
        throw error;
    }
}

export async function getCouponById(couponId) {
    try {
        const { data } = await apiClient.request({
            method: 'GET',
            url: `/coupons/${couponId}`,
        });

        return data;
    } catch (error) {
        console.error("Error fetching coupon details:", error);
        throw error;
    }
}
