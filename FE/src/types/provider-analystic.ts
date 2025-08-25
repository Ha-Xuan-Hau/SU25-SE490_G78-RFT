interface OverviewRequest {
  startDate: string; // "2024-01-01"
  endDate: string; // "2024-01-31"
}

interface OverviewResponse {
  // Dữ liệu tổng quan
  customers: number; // Tổng số khách hàng (tất cả)
  revenue: number; // Tổng doanh thu (tất cả)
  successCustomers: number; // Số khách hàng có đơn thành công (typo: successCustomerss trong code)
  successRevenue: number; // Doanh thu từ đơn thành công
  avgRevenue: number; // Doanh thu TB/khách hàng
  successfulOrders: number; // Số đơn/hợp đồng thành công
  cancelledOrders: number; // Số đơn/hợp đồng bị hủy

  // So sánh với kỳ trước (optional - hiện tại chưa dùng)
  comparison?: {
    customersGrowth: number; // % tăng/giảm
    revenueGrowth: number; // % tăng/giảm
    ordersGrowth: number; // % tăng/giảm
  };
}

interface TrendsRequest {
  startDate: string; // "2024-01-01"
  endDate: string; // "2024-01-31"
  metrics: string[]; // ["revenue", "customers", "bookings"]
  groupBy?: "hour" | "day" | "week" | "month"; // Optional, server tự detect
}

interface TrendsResponse {
  data: TrendDataPoint[];
  timeFrame: "hourly" | "daily" | "weekly" | "monthly";
}

interface TrendDataPoint {
  timestamp: string; // ISO 8601: "2024-01-15T00:00:00Z"

  // Các metrics động (chỉ trả về những metrics được request)
  customers?: number; // Khách hàng (tất cả)
  bookings?: number; // Đơn đặt xe (tất cả)
  revenue?: number; // Doanh thu (tất cả)
  successCustomers?: number; // Khách hàng thành công
  successBooking?: number; // Đơn thành công
  successRevenue?: number; // Doanh thu thành công
  avgRevenue?: number; // TB/Khách hàng
  conversionRate?: number; // Tỉ lệ chuyển đổi (%)
}
