import { apiClient } from "./client";

export async function updateUser(id, body = {}) {
    const { data } = await apiClient.request({
        method: "PUT",
        url: `/users/${id}`,
        data: body,
    });

    return data;
}

