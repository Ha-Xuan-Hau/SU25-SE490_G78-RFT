import { apiClient } from "./client";
import { jwtDecode } from "jwt-decode";
import { fetchUserProfile } from "../recoils/user.state";

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

            // Giải mã token để lấy thông tin user cơ bản
            const decodedToken = jwtDecode(data.token);

            // Tạo đối tượng user từ token
            let userData = {
                id: decodedToken.userId,
                email: decodedToken.sub,
                phone: decodedToken.phone,
                role: decodedToken.scope,
                // Các thông tin khác từ token
            };

            try {
                // Lấy thông tin user đầy đủ từ API
                const fullUserData = await apiClient.request({
                    method: "GET",
                    url: "/users/get-user",
                    headers: {
                        Authorization: `Bearer ${data.token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (fullUserData.data) {
                    // Cập nhật userData với đầy đủ thông tin
                    userData = fullUserData.data;
                }
            } catch (profileError) {
                console.warn("Could not fetch complete profile:", profileError);
                // Tiếp tục với thông tin cơ bản từ token
            }

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