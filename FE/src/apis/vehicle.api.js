// Cập nhật ảnh và biển số cho 1 xe máy trong nhóm
export async function updateSingleMotorbikeInGroup({ vehicleId, images, licensePlate, accessToken }) {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/vehicles/update-single-motorbike/${vehicleId}`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        data: {
            images,
            licensePlate,
        },
    });
    return data;
}
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
        url: `/vehicles`,
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

        // Trả về toàn bộ pagination response object, không chỉ content
        return data;
    } catch (error) {
        console.error("Lỗi khi tìm kiếm xe:", error);
        throw error;
    }
}

export async function getBookedSlotById(vehicleId) {
    try {
        // Fetch from booking endpoint to get proper booking data with status
        const { data } = await apiClient.request({
            method: "GET",
            url: `/bookedTimeSlot/vehicle/${vehicleId}`,
        });

        // Convert to ExistingBooking format
        const bookings = Array.isArray(data) ? data : data.content || data.items || data.data || [];

        return bookings.map((booking, index) => ({
            id: booking.id || index + 1,
            startDate: booking.timeBookingStart || booking.timeFrom,
            endDate: booking.timeBookingEnd || booking.timeTo,
            status: booking.status || 'CONFIRMED'
        })).filter(booking =>
            // Only include active bookings (not cancelled)
            booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
        );
    } catch (error) {
        console.error("Lỗi khi lấy booking data:", error);
        // Fallback to old endpoint if new one fails
        try {
            const { data } = await apiClient.request({
                method: "GET",
                url: `bookedTimeSlot/vehicle/${vehicleId}`,
            });

            const slots = Array.isArray(data) ? data : data.content || data.items || data.data || [];

            return slots.map((slot, index) => ({
                id: index + 1,
                startDate: slot.timeFrom,
                endDate: slot.timeTo,
                status: 'CONFIRMED'
            }));
        } catch (fallbackError) {
            console.error("Fallback cũng thất bại:", fallbackError);
            return [];
        }
    }
}

export async function getAvailableThumbQuantity({ thumb, providerId, from, to }) {
    try {
        const { data } = await apiClient.request({
            method: "POST",
            url: "/vehicles/available-thumb-quantity",
            data: {
                thumb,
                providerId,
                from,
                to,
            },
        });
        // data: { quantity: number }
        return data.quantity || 0;
    } catch (error) {
        console.error("Error fetching available thumb quantity:", error);
        throw error;
    }
}

export async function getAvailableThumbList({ thumb, providerId, from, to }) {
    try {
        const { data } = await apiClient.request({
            method: "POST",
            url: "/vehicles/available-thumb-list",
            data: {
                thumb,
                providerId,
                from,
                to,
            },
        });
        // data: { vehicles: [...], quantity: number }
        // DTO
        return Array.isArray(data.vehicles) ? data.vehicles : data.content || data.items || data.data || [];
    } catch (error) {
        console.error("Error fetching available thumb list:", error);
        throw error;
    }
}


export async function updateVehicle({ vehicleId, body, accessToken }) {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/vehicles/${vehicleId}`,
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
