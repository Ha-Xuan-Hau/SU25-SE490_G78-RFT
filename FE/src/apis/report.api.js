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
    // Serious Errors - Báo cáo nghiêm trọng
    'DAMAGED_VEHICLE': { generalType: 'SERIOUS_ERROR', label: 'Khách làm hư hỏng xe', color: 'error' },
    'FRAUD': { generalType: 'SERIOUS_ERROR', label: 'Gian lận', color: 'error' },
    'MISLEADING_INFO': { generalType: 'SERIOUS_ERROR', label: 'Xe khác với mô tả', color: 'error' },
    'OWNER_NO_SHOW': { generalType: 'SERIOUS_ERROR', label: 'Chủ xe không giao xe', color: 'error' },
    'OWNER_CANCEL_UNREASONABLY': { generalType: 'SERIOUS_ERROR', label: 'Chủ xe hủy đơn không lý do', color: 'error' },
    'DOCUMENT_ISSUE': { generalType: 'SERIOUS_ERROR', label: 'Giấy tờ sai/mất', color: 'error' },
    'TECHNICAL_ISSUE': { generalType: 'SERIOUS_ERROR', label: 'Xe bị lỗi kỹ thuật', color: 'error' },
    'UNSAFE_VEHICLE': { generalType: 'SERIOUS_ERROR', label: 'Xe không an toàn', color: 'error' },
    'FUEL_LEVEL_INCORRECT': { generalType: 'SERIOUS_ERROR', label: 'Mức nhiên liệu không đúng', color: 'error' },
    'NO_INSURANCE': { generalType: 'SERIOUS_ERROR', label: 'Không có bảo hiểm', color: 'error' },
    'EXPIRED_INSURANCE': { generalType: 'SERIOUS_ERROR', label: 'Bảo hiểm hết hạn', color: 'error' },
    'FAKE_DOCUMENT': { generalType: 'SERIOUS_ERROR', label: 'Giấy tờ giả', color: 'error' },
    'FAKE_ORDER': { generalType: 'SERIOUS_ERROR', label: 'Đặt đơn giả', color: 'error' },
    'DISPUTE_REFUND': { generalType: 'SERIOUS_ERROR', label: 'Tranh chấp hoàn tiền/phạt', color: 'error' },
    'LATE_RETURN_NO_CONTACT': { generalType: 'SERIOUS_ERROR', label: 'Không trả xe đúng hạn và mất liên lạc', color: 'error' },

    // Non-serious Errors - Lỗi vi phạm
    'INAPPROPRIATE': { generalType: 'NON_SERIOUS_ERROR', label: 'Ngôn từ không phù hợp', color: 'red' },
    'VIOLENCE': { generalType: 'NON_SERIOUS_ERROR', label: 'Bạo lực', color: 'red' },
    'SPAM': { generalType: 'NON_SERIOUS_ERROR', label: 'Spam', color: 'orange' },
    'OTHERS': { generalType: 'NON_SERIOUS_ERROR', label: 'Khác', color: 'default' },
    'DIRTY_CAR': { generalType: 'NON_SERIOUS_ERROR', label: 'Xe bẩn', color: 'orange' },
    'MISLEADING_LISTING': { generalType: 'NON_SERIOUS_ERROR', label: 'Thông tin sai trong bài đăng', color: 'red' },

    // Staff Errors - Lỗi gắn cờ
    'STAFF_REPORT': { generalType: 'STAFF_ERROR', label: 'Báo cáo bởi nhân viên', color: 'blue' }
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



// Xử lý reject tất cả reports
export const rejectAllReports = async (reportId) => {
    const response = await apiClient.put('/reports/process/reject-all', null, {
        params: { reportId }
    });
    return response.data;
};

// Approve tất cả reports (không cần dùng trong flow hiện tại)
export const approveAllReports = async (targetId, type) => {
    const response = await apiClient.put('/reports/process/approve-all', null, {
        params: { targetId, type }
    });
    return response.data;
};

// Approve appeal
export const approveAppeal = async (appealId) => {
    const response = await apiClient.put(`/reports/appeal/${appealId}/approve`);
    return response.data;
};

// Reject appeal
export const rejectAppeal = async (appealId) => {
    const response = await apiClient.put(`/reports/appeal/${appealId}/reject`);
    return response.data;
};