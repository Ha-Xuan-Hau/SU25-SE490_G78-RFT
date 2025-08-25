"use client";
import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import DynamicStatisticsChart from "./dynamic-statistics-chart";
import { DateRangePicker } from "@/components/antd";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";
import { Download } from "lucide-react";
import { Select } from "antd";
import { getMonthlyStatistics, calculateGrowthRate } from "@/apis/provider.api";
import { message } from "antd";
import { showApiError } from "@/utils/toast.utils";

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
  tooltip?: string;
}

interface MonthlyStatistics {
  month: number;
  year: number;
  totalCustomersWithFinalContract: number;
  customersWithCompletedContracts: number;
  totalRevenueFromFinalContracts: number;
  revenueFromCompletedContracts: number;
  averageRevenuePerCustomer: number;
  totalFinalContracts: number;
  completedFinalContracts: number;
  cancelledFinalContracts: number;
}

interface ComparisonData {
  current: MonthlyStatistics;
  previous?: MonthlyStatistics;
  growthRates: {
    customers: number;
    revenue: number;
    orders: number;
    successCustomers: number;
    successRevenue: number;
    avgRevenue: number;
  };
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
  {
    id: "customers",
    label: "Khách hàng",
    color: COLORS.secondary,
  },
  { id: "bookings", label: "Đơn đặt xe", color: COLORS.tertiary },
  { id: "revenue", label: "Doanh số", color: COLORS.quaternary },
];

const SUCCESS_ORDERS_METRICS: MetricItem[] = [
  { id: "successCustomers", label: "Khách hàng", color: COLORS.primary },
  { id: "successBookings", label: "Đơn đặt xe", color: COLORS.secondary },
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

// Generate month options
const generateMonthOptions = () => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return months.slice(0, currentMonth).map((month, index) => ({
    label: `${month}/${currentYear}`,
    value: index + 1,
  }));
};

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const dateConfig = getDateRange();
  const [dateRange, setDateRange] = useState(dateConfig.default);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [dateRangeValue, setDateRangeValue] = useState<
    [Dayjs | null, Dayjs | null]
  >([dayjs(dateConfig.default.startDate), dayjs(dateConfig.default.endDate)]);

  // Thêm states mới cho monthly statistics
  const [monthlyData, setMonthlyData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthlyStatistics();
  }, [selectedMonth]);

  const fetchMonthlyStatistics = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();

      // Fetch current month
      const currentMonthData = await getMonthlyStatistics(
        selectedMonth,
        currentYear
      );

      // Fetch previous month
      let previousMonthData = null;
      let previousMonth = selectedMonth - 1;
      let previousYear = currentYear;

      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }

      try {
        previousMonthData = await getMonthlyStatistics(
          previousMonth,
          previousYear
        );
      } catch (error) {
        console.log("No data for previous month");
      }

      // Calculate growth rates với xử lý chia cho 0
      const growthRates = {
        customers: previousMonthData?.totalCustomersWithFinalContract
          ? Number(
              calculateGrowthRate(
                currentMonthData.totalCustomersWithFinalContract,
                previousMonthData.totalCustomersWithFinalContract
              )
            )
          : currentMonthData.totalCustomersWithFinalContract > 0
          ? 100
          : 0,
        revenue: previousMonthData?.totalRevenueFromFinalContracts
          ? Number(
              calculateGrowthRate(
                currentMonthData.totalRevenueFromFinalContracts,
                previousMonthData.totalRevenueFromFinalContracts
              )
            )
          : currentMonthData.totalRevenueFromFinalContracts > 0
          ? 100
          : 0,
        orders: previousMonthData?.totalFinalContracts
          ? Number(
              calculateGrowthRate(
                currentMonthData.totalFinalContracts,
                previousMonthData.totalFinalContracts
              )
            )
          : currentMonthData.totalFinalContracts > 0
          ? 100
          : 0,
        successCustomers: previousMonthData?.customersWithCompletedContracts
          ? Number(
              calculateGrowthRate(
                currentMonthData.customersWithCompletedContracts,
                previousMonthData.customersWithCompletedContracts
              )
            )
          : currentMonthData.customersWithCompletedContracts > 0
          ? 100
          : 0,
        successRevenue: previousMonthData?.revenueFromCompletedContracts
          ? Number(
              calculateGrowthRate(
                currentMonthData.revenueFromCompletedContracts,
                previousMonthData.revenueFromCompletedContracts
              )
            )
          : currentMonthData.revenueFromCompletedContracts > 0
          ? 100
          : 0,
        avgRevenue: previousMonthData?.averageRevenuePerCustomer
          ? Number(
              calculateGrowthRate(
                currentMonthData.averageRevenuePerCustomer,
                previousMonthData.averageRevenuePerCustomer
              )
            )
          : currentMonthData.averageRevenuePerCustomer > 0
          ? 100
          : 0,
      };

      setMonthlyData({
        current: currentMonthData,
        previous: previousMonthData,
        growthRates,
      });
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Data processing - sử dụng data từ API thay vì mock data
  const analyticsData = monthlyData
    ? {
        customers: monthlyData.current.totalCustomersWithFinalContract || 0,
        revenue: monthlyData.current.totalRevenueFromFinalContracts || 0,
        successCustomerss:
          monthlyData.current.customersWithCompletedContracts || 0,
        successRevenue: monthlyData.current.revenueFromCompletedContracts || 0,
        avgRevenue: monthlyData.current.averageRevenuePerCustomer || 0,
        successfulOrders: monthlyData.current.completedFinalContracts || 0,
        cancelledOrders: monthlyData.current.cancelledFinalContracts || 0,
      }
    : {
        customers: 0,
        revenue: 0,
        successCustomerss: 0,
        successRevenue: 0,
        avgRevenue: 0,
        successfulOrders: 0,
        cancelledOrders: 0,
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
          0,
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
  const handleDateRangeChange: RangePickerProps["onChange"] = (values) => {
    if (values && values[0] && values[1]) {
      const [startDate, endDate] = values;
      setDateRangeValue([startDate, endDate]);
      setDateRange({
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      });
    }
  };

  const handleMonthChange = (value: number) => {
    setSelectedMonth(value);
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
  const MetricCard = ({
    title,
    value,
    bgColor,
    borderColor,
    titleColor,
    isRevenue = false,
    growthRate = 0,
  }: {
    title: string;
    value: number;
    bgColor: string;
    borderColor: string;
    titleColor: string;
    isRevenue?: boolean;
    growthRate?: number;
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
          {loading ? (
            <span className="inline-block animate-pulse bg-gray-200 rounded w-32 h-8"></span>
          ) : isRevenue ? (
            `₫ ${formatNumber(value)}`
          ) : (
            formatNumber(value)
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">So với tháng trước:</span>
          {growthRate !== 0 && (
            <span
              className={`text-xs font-semibold ${
                growthRate > 0
                  ? "text-green-600"
                  : growthRate < 0
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {growthRate > 0 ? "↑" : growthRate < 0 ? "↓" : ""}{" "}
              {Math.abs(growthRate)}%
            </span>
          )}
        </div>
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
        </div>
        {metric.tooltip && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {metric.tooltip}
          </p>
        )}
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Overview Section với Month Selector */}
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        {/* Header với Month Selector */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Tổng Quan về Doanh Số
            </h2>
            <div className="w-12 h-1 bg-primary rounded-full"></div>
          </div>

          {/* Month Selector và Export Button nằm cùng một div */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chọn tháng:
              </label>
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                options={generateMonthOptions()}
                size="large"
                style={{ minWidth: 150 }}
                placeholder="Chọn tháng"
                loading={loading}
              />
            </div>

            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </button>
          </div>
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
                  bgColor={`linear-gradient(135deg, ${COLORS.primary}1A 0%, ${COLORS.secondary}0D 100%)`}
                  borderColor={`${COLORS.primary}33`}
                  titleColor={COLORS.primary}
                  growthRate={monthlyData?.growthRates.customers || 0}
                />
                <MetricCard
                  title="Doanh số"
                  value={analyticsData.revenue}
                  bgColor={`linear-gradient(135deg, ${COLORS.secondary}1A 0%, ${COLORS.primary}0D 100%)`}
                  borderColor={`${COLORS.secondary}33`}
                  titleColor={COLORS.secondary}
                  isRevenue
                  growthRate={monthlyData?.growthRates.revenue || 0}
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
                  growthRate={monthlyData?.growthRates.successCustomers || 0}
                />
                <MetricCard
                  title="Doanh số"
                  value={analyticsData.successRevenue}
                  bgColor={`linear-gradient(135deg, ${COLORS.secondary}1A 0%, ${COLORS.primary}0D 100%)`}
                  borderColor={`${COLORS.secondary}33`}
                  titleColor={COLORS.secondary}
                  isRevenue
                  growthRate={monthlyData?.growthRates.successRevenue || 0}
                />
                <MetricCard
                  title="Doanh số trên mỗi khách hàng"
                  value={avgRevenuePerCustomer}
                  bgColor={COLORS.warning}
                  borderColor={COLORS.warningBorder}
                  titleColor="#f59e0b"
                  isRevenue
                  growthRate={monthlyData?.growthRates.avgRevenue || 0}
                />
              </div>
            </div>
          </div>

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

                {/* <div
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
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis với Date Range Picker */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          {/* Header với Date Range Picker */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between mb-4">
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

            {/* Date Range Picker */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Khung thời gian:
                </label>
                <DateRangePicker
                  value={dateRangeValue}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                  className="min-w-[300px]"
                  size="middle"
                  style={{
                    minWidth: 300,
                  }}
                  disabledDate={(current) => {
                    if (!current) return false;
                    if (current.isAfter(dayjs())) return true;
                    if (current.isBefore(dayjs(dateConfig.min))) return true;
                    return false;
                  }}
                  presets={[
                    {
                      label: "7 ngày qua",
                      value: [dayjs().subtract(7, "day"), dayjs()],
                    },
                    {
                      label: "30 ngày qua",
                      value: [dayjs().subtract(30, "day"), dayjs()],
                    },
                    {
                      label: "Tháng này",
                      value: [dayjs().startOf("month"), dayjs()],
                    },
                    {
                      label: "Tháng trước",
                      value: [
                        dayjs().subtract(1, "month").startOf("month"),
                        dayjs().subtract(1, "month").endOf("month"),
                      ],
                    },
                  ]}
                />
              </div>
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
