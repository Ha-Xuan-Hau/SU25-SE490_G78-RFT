import { apiClient } from './client'; // Đường dẫn tùy theo cấu trúc thư mục của bạn

// const API_URL = '/adminmanageusers';

export const getUsers = async (params) => {
    const response = await apiClient.get('/adminmanageusers', { params });
    return response.data;
};

export const updateUserStatus = async (userId, status) => {
    const response = await apiClient.put(`/adminmanageusers/${userId}/status`, {
        status,
    });
    return response.data;
};

export const searchUsersByName = async (name, page = 0, size = 10) => {
    const response = await apiClient.get(`/adminmanageusers/search/name`, {
        params: { name, page, size },
    });
    return response.data;
};

export const searchUsersByEmail = async (email, page = 0, size = 10) => {
    const response = await apiClient.get(`/adminmanageusers/search/email`, {
        params: { email, page, size },
    });
    return response.data;
};

export const searchUsersByStatus = async (status, page = 0, size = 10) => {
    const response = await apiClient.get(`/adminmanageusers/search/status`, {
        params: { status, page, size },
    });
    return response.data;
};

export const getUserDetail = async (userId) => {
    const response = await apiClient.get(`/adminmanageusers/${userId}`);
    return response.data;
};

export const getAllFinalContracts = async () => {
    const response = await apiClient.get('/final-contracts');
    return response.data;
};

export const approveFinalContract = async (id, approvalData) => {
    const response = await apiClient.put(`/final-contracts/${id}`, approvalData);
    return response.data;
};