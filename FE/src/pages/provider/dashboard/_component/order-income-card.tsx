"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { formatCurrency } from "@/lib/format-currency";
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface OrderIncomeCardProps {
  statistics?: any;
}

export default function OrderIncomeCard({ statistics }: OrderIncomeCardProps) {
  // Lấy data từ statistics
  const monthlyRevenue = Number(statistics?.totalRevenue || 0);
  const totalFinished = statistics?.totalFinishedContracts || 0;
  const totalCancelled = statistics?.totalCancelledContracts || 0;
  const totalRenting = statistics?.totalRentingContracts || 0;

  const totalOrders = totalFinished + totalCancelled + totalRenting;

  // Tính phần trăm tăng trưởng
  const currentMonthRevenue =
    statistics?.monthlyRevenue?.slice(-1)[0]?.revenue || 0;
  const lastMonthRevenue =
    statistics?.monthlyRevenue?.slice(-2)[0]?.revenue || 0;
  const growthPercentage =
    lastMonthRevenue > 0
      ? (
          ((Number(currentMonthRevenue) - Number(lastMonthRevenue)) /
            Number(lastMonthRevenue)) *
          100
        ).toFixed(1)
      : 0;

  const chartData = {
    labels: ["Đang thuê", "Hoàn thành", "Đã hủy"],
    datasets: [
      {
        data: [totalRenting, totalFinished, totalCancelled],
        backgroundColor: ["#3B82F6", "#10B981", "#EF4444"],
        hoverBackgroundColor: ["#2563EB", "#059669", "#DC2626"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 8,
        cornerRadius: 8,
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      {/* Header với icon */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Thu nhập & Đơn hàng
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tháng này
            </p>
          </div>
        </div>

        {/* Growth indicator */}
        {growthPercentage !== 0 && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
              Number(growthPercentage) >= 0
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            {Number(growthPercentage) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-sm font-medium ${
                Number(growthPercentage) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {Math.abs(Number(growthPercentage))}%
            </span>
          </div>
        )}
      </div>

      {/* Main Revenue Display */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(monthlyRevenue)}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tổng thu nhập tháng này
        </p>
      </div>

      {/* Chart and Stats Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chart */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {totalOrders}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tổng đơn
              </div>
            </div>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="flex flex-col justify-center space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đang thuê
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalRenting}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Hoàn thành
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalFinished}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đã hủy
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalCancelled}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Tỷ lệ thành công
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {totalOrders > 0
                ? ((totalFinished / totalOrders) * 100).toFixed(0)
                : 0}
              %
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Đơn/Tháng
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {totalOrders}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              TB/Đơn
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {totalOrders > 0
                ? formatCurrency(monthlyRevenue / totalOrders)
                    .replace("₫", "")
                    .trim()
                : "0"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
