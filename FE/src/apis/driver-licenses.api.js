import { apiClient } from "./client";

/**
 * Lấy tất cả giấy phép lái xe
 * @returns {Promise<Array>} Mảng chứa thông tin giấy phép lái xe
 */
export async function getAllDriverLicenses() {
    try {
        const { data } = await apiClient.get("/driver-licenses");
        return data; // Trả về danh sách giấy phép
    } catch (error) {
        console.error("Lỗi khi lấy danh sách giấy phép:", error);
        throw error;
    }
}

/**
 * Lấy thông tin giấy phép lái xe theo ID
 * @param {string} licenseId
 * @returns {Promise<Object>} Thông tin giấy phép lái xe
 */
export async function getDriverLicenseById(licenseId) {
    try {
        const { data } = await apiClient.get(`/driver-licenses/${licenseId}`);
        return data; // Trả về thông tin giấy phép
    } catch (error) {
        console.error("Lỗi khi lấy thông tin giấy phép:", error);
        throw error;
    }
}

/**
 * Cập nhật trạng thái giấy phép lái xe
 * @param {string} licenseId
 * @param {Object} driverLicenseDTO
 * @returns {Promise<Object>} Thông tin giấy phép lái xe đã cập nhật
 */
export async function updateDriverLicenseStatus(licenseId, driverLicenseDTO) {
    try {
        const { data } = await apiClient.put(`/driver-licenses/${licenseId}`, driverLicenseDTO);
        return data; // Trả về thông tin giấy phép đã cập nhật
    } catch (error) {
        console.error("Lỗi khi cập nhật giấy phép lái xe:", error);
        throw error;
    }
}


/**
 * Lấy thông tin giấy phép lái xe của người dùng hiện tại
 * @returns {Promise<Array>} Mảng chứa thông tin giấy phép lái xe
 */
export async function getUserDriverLicenses() {
    try {
        const tokenStr = window.localStorage.getItem("access_token");

        if (!tokenStr) {
            throw new Error("Không tìm thấy access token");
        }

        // Parse token và lấy userId
        const token = JSON.parse(tokenStr);
        const tokenParts = token.split('.');

        if (tokenParts.length !== 3) {
            throw new Error("Token không hợp lệ");
        }

        const payload = tokenParts[1];
        const decodedData = JSON.parse(atob(payload));
        const userId = decodedData.userId;

        // Gọi API với userId từ token
        const { data } = await apiClient.request({
            method: "GET",
            url: `/driver-licenses/user/${userId}`,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            withCredentials: true,
        });

        return data; // Trả về mảng các giấy phép
    } catch (error) {
        console.error("Lỗi khi lấy thông tin giấy phép lái xe:", error);
        throw error;
    }
}
