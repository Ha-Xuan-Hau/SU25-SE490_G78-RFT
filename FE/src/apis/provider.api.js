import { apiClient } from "./client";

export async function registerProvider(payload) {
    return apiClient.post("/providers/register", payload);
}