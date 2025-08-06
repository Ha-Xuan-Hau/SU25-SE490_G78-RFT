import { apiClient } from './client';

// const API_URL = '/adminmanageusers';

// User Management API Endpoints
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

// Final Contracts API Endpoints
export const getAllFinalContracts = async () => {
    const response = await apiClient.get('/final-contracts');
    return response.data;
};

// Final Contracts API Endpoints
export const getAllFinalUnapprovedContracts = async () => {
    const response = await apiClient.get('/final-contracts/unapproved');
    return response.data;
};

export const approveFinalContract = async (id, approvalData) => {
    const response = await apiClient.put(`/final-contracts/${id}`, approvalData);
    return response.data;
};

// Vehicle Management API Endpoints
export const getPendingVehicles = async (params) => {
    const response = await apiClient.get('/admin/vehicles/pending', { params });
    return response.data;
};

export const getPendingStats = async () => {
    const response = await apiClient.get('/admin/vehicles/pending/stats');
    return response.data;
};

export const getVehicleDetail = async (vehicleId) => {
    const response = await apiClient.get(`/admin/vehicles/${vehicleId}`);
    return response.data;
};

export const updateVehicleStatus = async (vehicleId, status, rejectReason) => {
    const response = await apiClient.put(`/admin/vehicles/${vehicleId}/status`, {
        vehicleId,
        status,
        rejectReason,
    });
    return response.data;
};

export const updateMultipleVehicleStatuses = async (requests) => {
    const response = await apiClient.put('/admin/vehicles/status/batch', requests);
    return response.data;
};

