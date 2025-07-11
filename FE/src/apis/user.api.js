import { apiClient } from "./client";

export async function updateUserProfile(id, body = {}) {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/users/${id}/profile`,
        data: body,
    });
    return data;
}
