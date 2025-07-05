import { apiClient } from './client';

export async function getVehicles() {
    try {
        const response = await apiClient.request({
            method: 'GET',
            url: '/vehicles',
        });

        const data = response.data;
        return Array.isArray(data) ? data : data.content || data.items || data.data || [];
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        throw error;
    }
}

export async function getVehicleById(vehicleId) {
    try {
        const { data } = await apiClient.request({
            method: "GET",
            url: `/vehicles/detail/${vehicleId}`,
        });

        return data;
    } catch (error) {
        console.error("Error fetching vehicle details:", error);
        throw error;
    }
}

export async function createVehicle({ body, accessToken }) {
    const { data } = await apiClient.request({
        method: "POST",
        url: `/vehicles/createVehicles`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        data: body,
    });

    return data;
}

export async function searchVehicles({ body }) {
    try {
        console.log("Sending search request to: vehicles/search");

        // Explicitly set the URL with a forward slash at the beginning
        const { data } = await apiClient.request({
            method: "POST",
            url: `/vehicles/search`,
            headers: {
                "Content-Type": "application/json",
                // Explicitly clear authorization to ensure public access
                "Authorization": undefined
            },
            data: body,
        });

        console.log("Search response received:", data);
        return Array.isArray(data) ? data : data.content || data.items || data.data || [];
    } catch (error) {
        console.error("Lỗi khi tìm kiếm xe:", error);
        throw error;
    }
}

export async function getBookedSlotById(vehicleId) {
    try {
        const { data } = await apiClient.request({
            method: "GET",
            url: `bookedTimeSlot/vehicle/${vehicleId}`,
        })
        return Array.isArray(data) ? data : data.content || data.items || data.data || [];
    } catch (error) {
        console.error("Lỗi khi tìm kiếm xe:", error)
        throw error
    }
}

export async function updateVehicle({ vehicleId, body, accessToken }) {
    console.log(vehicleId, body);
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/vehicles/updateVehicle/${vehicleId}`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        data: body,
    });

    return data;
}
export const updateCarStatus = async ({ accessToken, vehicleId, status }) => {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/admin/update-status-vehicle/${vehicleId}`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        data: {
            status,
        },
    });

    return data;
};
