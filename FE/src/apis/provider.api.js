import { apiClient } from "./client";

export async function registerProvider(payload) {
    return apiClient.post("/providers/register", payload);
}

// 1. Lấy danh sách penalty theo userId
export async function getPenaltiesByUserId(userId) {
    const { data } = await apiClient.get(`/penalties/user/${userId}`);
    return data;
}

// 2. Tạo penalty mới
export async function createPenalty(payload) {
    const { data } = await apiClient.post("/penalties", payload);
    return data;
}

// 3. Sửa penalty
export async function updatePenalty(id, payload) {
    const { data } = await apiClient.put(`/penalties/${id}`, payload);
    return data;
}

// 4. Xóa penalty (nếu chưa bị sử dụng)
export async function deletePenalty(id) {
    const { data } = await apiClient.delete(`/penalties/${id}`);
    return data;
}

// 5. Xem chi tiết penalty theo id
export async function getPenaltyById(id) {
    const { data } = await apiClient.get(`/penalties/${id}`);
    return data;
}

// Lấy thống kê dashboard provider
export async function getProviderStatistics() {
    const { data } = await apiClient.get("/vehicle-rent/statistics");
    return data;
}
