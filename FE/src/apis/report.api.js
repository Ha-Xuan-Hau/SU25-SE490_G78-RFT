import { apiClient } from './client';

// Report Management API Endpoints

/**
 * Tạo mới một báo cáo
 * @param {Object} reportData - Dữ liệu báo cáo
 * @param {string} reportData.targetId - ID người/xe bị báo cáo
 * @param {string} reportData.generalType - Loại báo cáo tổng quát (NON_SERIOUS_ERROR, SERIOUS_ERROR, STAFF_ERROR)
 * @param {string} reportData.type - Loại báo cáo cụ thể (SPAM, INAPPROPRIATE, etc.)
 * @param {string} reportData.reason - Lý do báo cáo
 * @returns {Promise} Response từ server
 */
export const createReport = async (reportData) => {
    try {
        const response = await apiClient.post('/reports', reportData);
        return response.data;
    } catch (error) {
        // Handle specific error cases
        if (error.response?.status === 400) {
            throw new Error('Dữ liệu báo cáo không hợp lệ');
        } else if (error.response?.status === 401) {
            throw new Error('Bạn cần đăng nhập để báo cáo');
        } else if (error.response?.status === 429) {
            throw new Error('Bạn đã báo cáo quá nhiều. Vui lòng thử lại sau');
        }
        throw error;
    }
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
