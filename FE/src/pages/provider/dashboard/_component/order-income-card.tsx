"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { formatCurrency } from "@/lib/format-currency";

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
    labels: ["Đang thuê", "Đã hoàn thành", "Đã hủy"],
    datasets: [
      {
        data: [totalRenting, totalFinished, totalCancelled],
        backgroundColor: ["#36A2EB", "#4CAF50", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#4CAF50", "#FF6384"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "80%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 sm:pb-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Thống kê Đơn hàng & Thu nhập
        </h2>
      </div>

      {/* Content - 2 columns equal */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Stats */}
        <div className="flex flex-col justify-center space-y-3">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">
                {formatCurrency(monthlyRevenue)}
              </span>
              <span className="text-gray-500 text-sm">
                Thu nhập trong tháng
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">
                {totalRenting} đơn
              </span>
              <span className="text-gray-500 text-sm">Đang thuê</span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 flex-shrink-0"></span>
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">
                {totalFinished} đơn
              </span>
              <span className="text-gray-500 text-sm">Đã hoàn thành</span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">
                {totalCancelled} đơn
              </span>
              <span className="text-gray-500 text-sm">Đã hủy</span>
            </div>
          </div>

          {growthPercentage !== 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500">
                <span
                  className={`font-semibold ${
                    Number(growthPercentage) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {Number(growthPercentage) > 0 ? "+" : ""}
                  {growthPercentage}%
                </span>{" "}
                {Number(growthPercentage) >= 0 ? "Tăng" : "Giảm"} so với tháng
                trước
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Chart */}
        <div className="flex items-center justify-center">
          <div className="relative h-40 w-40">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-800">
                {totalOrders}
              </div>
              <div className="text-sm text-gray-500">Tổng đơn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
