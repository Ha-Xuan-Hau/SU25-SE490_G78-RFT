import { apiClient } from "./client";

export async function updateUser(id, body = {}) {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/users/${id}`,
        data: body,
    });

    return data;
}

// export async function getUserProfile(userId) {
//     try {
//         const value = window.localStorage.getItem("access_token");

//         if (!value) {
//             throw new Error("No access token found");
//         }

//         const { data } = await apiClient.request({
//             method: "GET",
//             url: `/users/${userId}/profile`,
//             headers: {
//                 Authorization: `Bearer ${JSON.parse(value)}`,
//                 "Content-Type": "application/json",
//             },
//             withCredentials: true,
//         });

//         return data;
//     } catch (error) {
//         console.error("Error fetching user profile:", error);
//         throw error;
//     }
// }
