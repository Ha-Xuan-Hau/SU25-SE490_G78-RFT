import { apiClient } from "./client";

export async function registerProvider(payload) {
    return apiClient.post("/providers/register", payload);
}

// Lấy danh sách penalty theo userId
export async function getPenaltiesByUserId(userId) {
    const { data } = await apiClient.get(`/penalties/user/${userId}`);
    return data;
}

// Tạo penalty mới
export async function createPenalty(payload) {
    const { data } = await apiClient.post("/penalties", payload);
    return data;
}

// Sửa penalty
export async function updatePenalty(id, payload) {
    const { data } = await apiClient.put(`/penalties/${id}`, payload);
    return data;
}

// Xóa penalty (nếu chưa bị sử dụng)
export async function deletePenalty(id) {
    const { data } = await apiClient.delete(`/penalties/${id}`);
    return data;
}

//Xem chi tiết penalty theo id
export async function getPenaltyById(id) {
    const { data } = await apiClient.get(`/penalties/${id}`);
    return data;
}

// Lấy thống kê dashboard provider
export async function getProviderStatistics() {
    const { data } = await apiClient.get("/vehicle-rent/statistics");
    return data;
}

export async function getProviderMonthlyStatistics() {
    const { data } = await apiClient.get("/vehicle-rent/statistics/monthly");
    return data;
}

export async function getTodoWork() {
    const { data } = await apiClient.get("/bookings/today-summary");
    return data;
}

//Lấy metric data cho biểu đồ động
export async function getMetricData(request) {
    const { data } = await apiClient.post("/providers/metric", request);
    return data;
}

// Lấy nhiều metrics cùng lúc (wrapper function)
export async function getMultipleMetrics(startDate, endDate, metrics, groupBy) {
    try {
        // Gọi API cho từng metric song song
        const promises = metrics.map(metric =>
            getMetricData({
                startDate,
                endDate,
                metric,
                groupBy
            })
        );

        const responses = await Promise.all(promises);

        // Transform data để phù hợp với format của DynamicStatisticsChart
        return transformMetricsData(responses);
    } catch (error) {
        console.error("Error fetching metrics:", error);
        throw error;
    }
}

//Transform data từ API response sang format cho chart
function transformMetricsData(responses) {
    // Tạo map để group data points theo timestamp
    const dataMap = new Map();

    responses.forEach(response => {
        const { metric, data } = response;

        data.forEach(point => {
            const timestamp = point.timestamp;

            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, {
                    timestamp: new Date(timestamp)
                });
            }

            // Thêm value của metric vào data point
            const dataPoint = dataMap.get(timestamp);
            dataPoint[metric] = point.value;
        });
    });

    // Convert map thành array và sort theo timestamp
    const chartData = Array.from(dataMap.values())
        .sort((a, b) => a.timestamp - b.timestamp);

    return chartData;
}

//Utility function để detect groupBy tự động
export function detectGroupBy(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
        return "hour";
    } else if (daysDiff <= 31) {
        return "day";
    } else if (daysDiff <= 60) {
        return "week";
    } else {
        return "month";
    }
}

//Lấy thống kê theo tháng
export async function getMonthlyStatistics(month, year) {
    try {
        const { data } = await apiClient.get('/vehicle-rent/statistics/monthly', {
            params: { month, year }
        });
        return data;
    } catch (error) {
        console.error("Error fetching monthly statistics:", error);
        throw error;
    }
}

//Helper function để tính % thay đổi
export function calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(2));
}

