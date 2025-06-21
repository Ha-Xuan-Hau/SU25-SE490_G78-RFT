import { apiClient } from "./client";
import { jwtDecode } from "jwt-decode";

export async function login(credentials) {
    try {
        const { data } = await apiClient.request({
            method: "POST",
            url: "/auth/login",
            data: credentials,
        });

        if (data.token) {
            // Lưu token
            localStorage.setItem("access_token", JSON.stringify(data.token));

            // Giải mã token để lấy thông tin user
            const decodedToken = jwtDecode(data.token);

            // Tạo đối tượng user từ token
            const userData = {
                id: decodedToken.userId,
                email: decodedToken.sub,
                phone: decodedToken.phone,
                role: decodedToken.scope,
                // Các thông tin khác từ token
            };

            // Lưu thông tin user
            localStorage.setItem("user_profile", JSON.stringify(userData));

            // Trả về cả token và userData để cập nhật context
            return {
                access_token: data.token,
                result: userData
            };
        }

        return data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
