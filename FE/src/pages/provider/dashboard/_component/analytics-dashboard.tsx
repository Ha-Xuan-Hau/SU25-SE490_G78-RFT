// pages/provider/dashboard/_component/analytics-dashboard.tsx
"use client";
import { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import StatisticsChartMonth from "./statistic-chart-month";
import DynamicStatisticsChart from "./dynamic-statistics-chart";

ChartJS.register(ArcElement, Tooltip, Legend);

// Types
interface AnalyticsData {
  customers: number;
  revenue: number;
  successCustomerss: number;
  successRevenue: number;
  avgRevenue: number;
  successfulOrders: number;
  cancelledOrders: number;
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
}

interface MetricItem {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
}

// Constants
const COLORS = {
  primary: "#4682A9",
  secondary: "#749BC2",
  tertiary: "#91C8E4",
  quaternary: "#F6F4EB",
  warning: "rgba(245, 158, 11, 0.05)",
  warningBorder: "rgba(245, 158, 11, 0.2)",
};

const MAX_SELECTED_METRICS = 4;

const ALL_ORDERS_METRICS: MetricItem[] = [
  { id: "customers", label: "Khách hàng", color: COLORS.secondary },
  { id: "bookings", label: "Đơn đặt xe", color: COLORS.tertiary },
  { id: "revenue", label: "Doanh số", color: COLORS.quaternary },
];

const SUCCESS_ORDERS_METRICS: MetricItem[] = [
  { id: "successCustomers", label: "Khách hàng", color: COLORS.primary },
  { id: "successBooking", label: "Đơn đặt xe", color: COLORS.secondary },
  { id: "successRevenue", label: "Doanh số", color: COLORS.quaternary },
  {
    id: "avgRevenue",
    label: "Doanh số trung bình trên mỗi khách hàng",
    color: COLORS.quaternary,
  },
  {
    id: "conversionRate",
    label: "Tỉ lệ chuyển đổi (từ đơn đặt xe thành đơn thành công)",
    color: COLORS.quaternary,
  },
];

// Utility functions
const formatNumber = (num: number) => num.toLocaleString("vi-VN");
const formatCurrency = (num: number) => `${formatNumber(num)}₫`;

const getDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

  return {
    default: {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    },
    min: fourMonthsAgo.toISOString().split("T")[0],
    max: today.toISOString().split("T")[0],
  };
};

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const dateConfig = getDateRange();
  const [dateRange, setDateRange] = useState(dateConfig.default);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["revenue"]);

  // Data processing
  const analyticsData = {
    customers: data?.customers || 0,
    revenue: data?.revenue || 0,
    successCustomerss: data?.successCustomerss || 0,
    successRevenue: data?.successRevenue || 0,
    avgRevenue: data?.avgRevenue || 0,
    successfulOrders: data?.successfulOrders || 15,
    cancelledOrders: data?.cancelledOrders || 3,
  };

  const totalOrders =
    analyticsData.successfulOrders + analyticsData.cancelledOrders;
  const successRate =
    totalOrders > 0
      ? ((analyticsData.successfulOrders / totalOrders) * 100).toFixed(1)
      : "0";
  const avgRevenuePerCustomer =
    analyticsData.successCustomerss > 0
      ? Math.round(
          analyticsData.successRevenue / analyticsData.successCustomerss
        )
      : 0;

  // Chart configuration
  const chartData = {
    labels: ["Thành công", "Bị hủy", "Chờ xử lý"],
    datasets: [
      {
        data: [
          analyticsData.successfulOrders,
          analyticsData.cancelledOrders,
          0, // Có thể thêm trạng thái khác nếu cần
        ],
        backgroundColor: ["#10B981", "#EF4444", "#FCD34D"],
        borderWidth: 2,
        borderColor: "#fff",
        cutout: "70%",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const percentage =
              totalOrders > 0 ? ((value / totalOrders) * 100).toFixed(1) : "0";
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Event handlers
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleMetricToggle = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter((id) => id !== metricId));
    } else if (selectedMetrics.length < MAX_SELECTED_METRICS) {
      setSelectedMetrics([...selectedMetrics, metricId]);
    } else {
      alert(
        `Bạn chỉ có thể chọn tối đa ${MAX_SELECTED_METRICS} chỉ số để so sánh`
      );
    }
  };

  // Component parts
  const DateRangePicker = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Bắt đầu từ ngày
        </label>
        <input
          type="date"
          value={dateRange.startDate}
          min={dateConfig.min}
          max={dateRange.endDate}
          onChange={(e) => handleDateChange("startDate", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Đến cuối ngày
        </label>
        <input
          type="date"
          value={dateRange.endDate}
          min={dateRange.startDate}
          max={dateConfig.max}
          onChange={(e) => handleDateChange("endDate", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Tải dữ liệu
      </button>
    </div>
  );

  const MetricCard = ({
    title,
    value,
    bgColor,
    borderColor,
    titleColor,
    isRevenue = false,
  }: {
    title: string;
    value: number;
    bgColor: string;
    borderColor: string;
    titleColor: string;
    isRevenue?: boolean;
  }) => (
    <div
      className="rounded-lg p-6 border transition-colors hover:border-opacity-40"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="flex flex-col gap-3">
        <p
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: titleColor }}
        >
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900">
          {isRevenue ? `₫ ${formatNumber(value)}` : formatNumber(value)}
        </p>
        <p className="text-xs text-gray-500">so với thời gian trước: 0.00%</p>
      </div>
    </div>
  );

  const MetricCheckbox = ({
    metric,
    isDisabled,
  }: {
    metric: MetricItem;
    isDisabled: boolean;
  }) => (
    <label
      className={`
        relative flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all
        ${
          selectedMetrics.includes(metric.id)
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          checked={selectedMetrics.includes(metric.id)}
          onChange={() => handleMetricToggle(metric.id)}
          disabled={isDisabled}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>
      <div className="ml-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {metric.label}
          </span>
          <svg
            className="w-3 h-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        {metric.sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {metric.sublabel}
          </p>
        )}
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <DateRangePicker />
      </div>

      {/* Overview Section */}
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Tổng Quan về Doanh Số
          </h2>
          <div className="w-12 h-1 bg-primary rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="col-span-3 flex flex-col gap-8">
            {/* All Orders */}
            <div className="flex flex-col gap-6">
              <h3
                className="text-lg font-semibold pb-3 border-b"
                style={{
                  color: COLORS.primary,
                  borderColor: `${COLORS.primary}33`,
                }}
              >
                Tất cả đơn đặt xe
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                <MetricCard
                  title="Khách hàng"
                  value={analyticsData.customers}
                  bgColor={`${COLORS.primary}0D`}
                  borderColor={`${COLORS.primary}33`}
                  titleColor={COLORS.primary}
                />
                <MetricCard
                  title="Doanh số"
                  value={analyticsData.revenue}
                  bgColor={`${COLORS.secondary}0D`}
                  borderColor={`${COLORS.secondary}33`}
                  titleColor={COLORS.secondary}
                  isRevenue
                />
              </div>
            </div>

            {/* Successful Orders */}
            <div className="flex flex-col gap-6">
              <h3
                className="text-lg font-semibold pb-3 border-b"
                style={{
                  color: COLORS.secondary,
                  borderColor: `${COLORS.secondary}33`,
                }}
              >
                Đơn được tất toán thành công
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
                <MetricCard
                  title="Khách hàng"
                  value={analyticsData.successCustomerss}
                  bgColor={`linear-gradient(135deg, ${COLORS.primary}1A 0%, ${COLORS.secondary}0D 100%)`}
                  borderColor={`${COLORS.primary}33`}
                  titleColor={COLORS.primary}
                />
                <MetricCard
                  title="Doanh số"
                  value={analyticsData.successRevenue}
                  bgColor={`linear-gradient(135deg, ${COLORS.secondary}1A 0%, ${COLORS.primary}0D 100%)`}
                  borderColor={`${COLORS.secondary}33`}
                  titleColor={COLORS.secondary}
                  isRevenue
                />
                <MetricCard
                  title="Doanh số trên mỗi khách hàng"
                  value={avgRevenuePerCustomer}
                  bgColor={COLORS.warning}
                  borderColor={COLORS.warningBorder}
                  titleColor="#f59e0b"
                  isRevenue
                />
              </div>
            </div>
          </div>

          {/* Success Rate Chart */}
          {/* Success Rate Chart */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-b from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/20 h-full">
              <div
                className="rounded-lg p-6 border h-full"
                style={{
                  background: `linear-gradient(180deg, ${COLORS.primary}0D 0%, ${COLORS.secondary}0D 100%)`,
                  borderColor: `${COLORS.primary}33`,
                }}
              >
                <h3
                  className="text-lg font-semibold mb-6 pb-3 border-b"
                  style={{
                    color: COLORS.primary,
                    borderColor: `${COLORS.primary}33`,
                  }}
                >
                  Tỷ lệ thành công
                </h3>

                <div className="flex justify-center mb-8">
                  <div className="relative w-40 h-40">
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className="text-3xl font-bold"
                        style={{ color: COLORS.primary }}
                      >
                        {totalOrders}
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Tổng hợp đồng
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  {/* Tổng đơn */}
                  <div
                    className="flex items-center justify-between pb-3 border-b"
                    style={{ borderColor: `${COLORS.primary}20` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS.primary }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        Tổng hợp đồng
                      </span>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-lg font-bold"
                        style={{ color: COLORS.primary }}
                      >
                        {totalOrders}
                      </div>
                      <div className="text-sm text-gray-500">100%</div>
                    </div>
                  </div>

                  {/* Chi tiết */}
                  <div className="pl-6 space-y-3">
                    {/* Đơn thành công */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: "#10B981" }}
                        ></div>
                        <span className="text-sm text-gray-500">
                          Hợp đồng thành công
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {analyticsData.successfulOrders}
                        </div>
                        <div className="text-sm text-gray-500">
                          {totalOrders > 0
                            ? (
                                (analyticsData.successfulOrders / totalOrders) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>

                    {/* Đơn bị hủy */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: "#EF4444" }}
                        ></div>
                        <span className="text-sm text-gray-500">
                          Hợp đồng bị hủy
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {analyticsData.cancelledOrders}
                        </div>
                        <div className="text-sm text-gray-500">
                          {totalOrders > 0
                            ? (
                                (analyticsData.cancelledOrders / totalOrders) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="pt-4 border-t"
                  style={{ borderColor: `${COLORS.primary}33` }}
                >
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">
                      Tỷ lệ thành công
                    </div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: "#10B981" }}
                    >
                      {successRate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Xu hướng số liệu
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Chọn tối đa {MAX_SELECTED_METRICS} chỉ số để so sánh xu hướng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Đã chọn: {selectedMetrics.length}/{MAX_SELECTED_METRICS}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* All Orders Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tất cả đơn đặt xe
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {ALL_ORDERS_METRICS.map((metric) => (
                  <MetricCheckbox
                    key={metric.id}
                    metric={metric}
                    isDisabled={
                      !selectedMetrics.includes(metric.id) &&
                      selectedMetrics.length >= MAX_SELECTED_METRICS
                    }
                  />
                ))}
              </div>
            </div>

            {/* Success Orders Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Đơn đặt xe thành công
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {SUCCESS_ORDERS_METRICS.map((metric) => (
                  <MetricCheckbox
                    key={metric.id}
                    metric={metric}
                    isDisabled={
                      !selectedMetrics.includes(metric.id) &&
                      selectedMetrics.length >= MAX_SELECTED_METRICS
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Đã chọn: {selectedMetrics.length}/{MAX_SELECTED_METRICS}
          </div>

          {selectedMetrics.length > 0 && (
            <div className="mt-6">
              <DynamicStatisticsChart
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                selectedMetrics={selectedMetrics}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
