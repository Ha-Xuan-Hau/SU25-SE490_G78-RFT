import { apiClient } from './client';

export async function getVehicles() {
    const data = await apiClient.request({
        method: 'GET',
        // url: '/api/vehicles?limit=0',
        url: '/vehicles',
    });

    return Array.isArray(data) ? data : data.content || data.items || data.data || [];
}

export async function getVehicleById(vehicleId) {
    const { data } = await apiClient.request({
        method: "GET",
        url: `/vehicles/${vehicleId}`,
    });

    return data;
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
};
