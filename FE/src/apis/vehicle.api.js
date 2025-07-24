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

export async function createCar({ body, accessToken }) {
    const { data } = await apiClient.request({
        method: "POST",
        url: `/vehicle-rent/register`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        data: body,
    });

    return data;
}

/**
 * Basic Search API - Tìm kiếm cơ bản
 * @param {Object} params - Tham số tìm kiếm cơ bản
 * @param {string} [params.address] - Địa chỉ
 * @param {string} [params.vehicleType] - Loại xe (CAR, MOTORBIKE, BICYCLE)
 * @param {string} [params.pickupDateTime] - Thời gian nhận xe (ISO format)
 * @param {string} [params.returnDateTime] - Thời gian trả xe (ISO format)
 * @param {number} [params.page=0] - Số trang (0-based)
 * @param {number} [params.size=10] - Kích thước trang
 * @returns {Promise} Response từ API
 */
export async function basicSearchVehicles(params) {
    try {
        console.log("Calling basic search API with params:", params);

        const requestBody = {
            address: params.address || '',
            vehicleType: params.vehicleType || '',
            pickupDateTime: params.pickupDateTime || undefined,
            returnDateTime: params.returnDateTime || undefined,
            page: params.page || 0,
            size: params.size || 10,
        };

        // Loại bỏ các field undefined
        Object.keys(requestBody).forEach(key => {
            if (requestBody[key] === undefined) {
                delete requestBody[key];
            }
        });

        const { data } = await apiClient.request({
            method: "POST",
            url: "/vehicles/search-basic",
            headers: {
                "Content-Type": "application/json",
            },
            data: requestBody,
        });

        console.log("Basic search response:", data);
        return data;
    } catch (error) {
        console.error("Basic search error:", error);

        if (error.response) {
            const errorMessage = error.response.data?.error || error.response.data?.message || "Lỗi từ server";
            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
            throw new Error("Đã xảy ra lỗi không xác định.");
        }
    }
}

/**
 * Advanced Search API - Tìm kiếm nâng cao
 * @param {Object} params - Tham số tìm kiếm nâng cao
 * @returns {Promise} Response từ API
 */
export async function advancedSearchVehicles(params) {
    try {
        console.log("Calling advanced search API with params:", params);

        const requestBody = {
            vehicleTypes: params.vehicleTypes || undefined,
            addresses: params.addresses || undefined,
            haveDriver: params.haveDriver || undefined,
            shipToAddress: params.shipToAddress || undefined,
            brandId: params.brandId || undefined,
            modelId: params.modelId || undefined,
            pickupDateTime: params.pickupDateTime || undefined,
            returnDateTime: params.returnDateTime || undefined,
            transmission: params.transmission || undefined,
            fuelType: params.fuelType || undefined,
            numberSeat: params.numberSeat || undefined,
            costFrom: params.costFrom || undefined,
            costTo: params.costTo || undefined,
            ratingFiveStarsOnly: params.ratingFiveStarsOnly || undefined,
            page: params.page || 0,
            size: params.size || 12,
        };

        // Loại bỏ các field undefined
        Object.keys(requestBody).forEach(key => {
            if (requestBody[key] === undefined) {
                delete requestBody[key];
            }
        });

        const { data } = await apiClient.request({
            method: "POST",
            url: "/vehicles/search",
            headers: {
                "Content-Type": "application/json",
            },
            data: requestBody,
        });

        console.log("Advanced search response:", data);
        return data;
    } catch (error) {
        console.error("Advanced search error:", error);

        if (error.response) {
            const errorMessage = error.response.data?.error || error.response.data?.message || "Lỗi từ server";
            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        } else {
            throw new Error("Đã xảy ra lỗi không xác định.");
        }
    }
}

// Helper functions
export function formatDateTimeForAPI(dateTime) {
    if (!dateTime) return null;
    if (typeof dateTime === 'string' && dateTime.includes('T')) {
        return dateTime;
    }
    if (dateTime instanceof Date) {
        return dateTime.toISOString();
    }
    return null;
}

export function validateSearchParams(params) {
    const errors = [];

    if (params.pickupDateTime && params.returnDateTime) {
        const pickupTime = new Date(params.pickupDateTime);
        const returnTime = new Date(params.returnDateTime);

        if (pickupTime >= returnTime) {
            errors.push("Thời gian nhận xe phải trước thời gian trả xe");
        }

        if (pickupTime < new Date()) {
            errors.push("Thời gian nhận xe không thể trong quá khứ");
        }
    }

    if (params.costFrom && params.costTo && params.costFrom > params.costTo) {
        errors.push("Giá từ không thể lớn hơn giá đến");
    }

    if (params.page && params.page < 0) {
        errors.push("Số trang phải >= 0");
    }

    if (params.size && params.size < 1) {
        errors.push("Kích thước trang phải >= 1");
    }

    return errors;
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


export async function updateCar({ vehicleId, body, accessToken }) {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/vehicle-rent/${vehicleId}`,
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
