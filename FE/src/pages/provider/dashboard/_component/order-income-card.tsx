"use client";
import { CardContent } from "@/components/ui/card";
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

  // Tính phần trăm tăng trưởng (giả sử so với tháng trước)
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Thống kê Đơn hàng & Thu nhập
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span className="text-gray-700 font-medium">
                  {formatCurrency(monthlyRevenue)}
                </span>
                <span className="text-gray-500 text-sm ml-2">
                  Thu nhập trong tháng
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-gray-700 font-medium">
                  {totalFinished}
                </span>
                <span className="text-gray-500 text-sm ml-2">
                  Đơn hoàn thành
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                <span className="text-gray-700 font-medium">
                  {totalCancelled}
                </span>
                <span className="text-gray-500 text-sm ml-2">Đơn đã hủy</span>
              </div>
              {growthPercentage !== 0 && (
                <p className="text-sm text-gray-500 mt-4">
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
              )}
            </div>
            <div className="relative flex items-center justify-end h-40 w-40 ml-auto">
              <Doughnut data={chartData} options={options} />
              <div className="absolute text-center left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <div className="text-2xl font-bold text-gray-800">
                  {totalOrders}
                </div>
                <div className="text-sm text-gray-500">Tổng đơn</div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
