import { apiClient } from "./client";

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