import { apiClient } from "./client";

export async function getUserVehicles(
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "desc"
) {
    try {
        const tokenStr = window.localStorage.getItem("access_token");

        if (!tokenStr) {
            throw new Error("Không tìm thấy access token");
        }

        const token = JSON.parse(tokenStr);

        // Lấy userId từ token JWT
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error("Token không hợp lệ");
        }
        const payload = tokenParts[1];
        const decodedData = JSON.parse(atob(payload));
        const userId = decodedData.userId;

        // Gọi API với đúng path và header User-Id
        const response = await apiClient.request({
            method: "GET",
            url: "/vehicle-rent/my-vehicles", // Đường dẫn API chính xác
            headers: {
                "Authorization": `Bearer ${token}`,
                "User-Id": userId  // Thêm User-Id vào header như API yêu cầu
            },
            params: {
                page,
                size,
                sortBy,
                sortDir
            }
        });

        // Response có cấu trúc ApiResponseDTO<PageResponseDTO<VehicleDTO>>
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách xe:", error);
        throw error;
    }
}

export async function getUserVehicleById(vehicleId) {
    try {
        const tokenStr = window.localStorage.getItem("access_token");

        if (!tokenStr) {
            throw new Error("Không tìm thấy access token");
        }

        const token = JSON.parse(tokenStr);

        // Lấy userId từ token JWT
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error("Token không hợp lệ");
        }
        const payload = tokenParts[1];
        const decodedData = JSON.parse(atob(payload));
        const userId = decodedData.userId;

        // Gọi API với đúng path và header User-Id
        const response = await apiClient.request({
            method: "GET",
            url: `/vehicle-rent/${vehicleId}`,
            headers: {
                "Authorization": `Bearer ${token}`,
                "User-Id": userId
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi lấy thông tin xe ${vehicleId}:`, error);
        throw error;
    }
}

export async function likeVehicles({ accessToken, carId }) {

}

export async function getVehiclesLiked(accessToken) {
}

export async function getCoupons() {
}

export async function registerVehicle() {

}