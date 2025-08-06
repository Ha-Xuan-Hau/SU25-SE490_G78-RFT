import { apiClient } from './client'; // Đường dẫn tùy theo cấu trúc thư mục của bạn

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

// Report Management API Endpoints

/**
 * Tạo mới một báo cáo
 */
export const createReport = async (reportData) => {
    const response = await apiClient.post('/reports', reportData);
    return response.data;
};

/**
 * Lấy danh sách báo cáo theo loại tổng quát
 */
export const getReportsByType = async (type, page = 0, size = 10) => {
    const response = await apiClient.get('/reports', {
        params: { type, page, size }
    });
    return response.data;
};

/**
 * Tìm kiếm báo cáo với các tiêu chí
 */
export const searchReports = async (generalType, keyword = "", type = "", page = 0, size = 10) => {
    const params = { generalType, page, size };

    if (keyword && keyword.trim()) params.keyword = keyword;
    if (type && type.trim()) params.type = type;

    const response = await apiClient.get('/reports/search', { params });
    return response.data;
};


/**
 * Lấy chi tiết báo cáo theo ID đối tượng bị báo cáo
 */
export const getReportDetail = async (targetId, type) => {
    const response = await apiClient.get(`/reports/detail/${targetId}`, {
        params: { type }
    });
    return response.data;
};

/**
 * Tạo báo cáo bởi nhân viên
 */
export const createReportByStaff = async (reportData) => {
    const response = await apiClient.post('/reports/staff', reportData);
    return response.data;
};

/**
 * Lấy mapping loại báo cáo cho frontend
 */
export const getReportTypeMapping = () => ({
    // Serious Errors
    'FRAUD': { generalType: 'SERIOUS_ERROR', label: 'Lừa đảo', color: 'error' },
    'VIOLENCE': { generalType: 'SERIOUS_ERROR', label: 'Bạo lực', color: 'error' },

    // Non-serious Errors  
    'SPAM': { generalType: 'NON_SERIOUS_ERROR', label: 'Spam', color: 'orange' },
    'INAPPROPRIATE': { generalType: 'NON_SERIOUS_ERROR', label: 'Không phù hợp', color: 'red' },

    // Staff Errors
    'OTHER': { generalType: 'STAFF_ERROR', label: 'Khác', color: 'default' },
    'Report by staff': { generalType: 'STAFF_ERROR', label: 'Báo cáo bởi nhân viên', color: 'blue' }
});

/**
 * Lấy thống kê báo cáo theo loại (từ dữ liệu đã load)
 */
export const calculateReportStatistics = (reports, generalType) => {
    if (!reports || !Array.isArray(reports)) {
        return {};
    }

    const typeMapping = getReportTypeMapping();
    const stats = {};

    reports.forEach(reportGroup => {
        const reportType = reportGroup.type;
        if (typeMapping[reportType]?.generalType === generalType) {
            stats[reportType] = (stats[reportType] || 0) + reportGroup.count;
        }
    });

    return stats;
};
