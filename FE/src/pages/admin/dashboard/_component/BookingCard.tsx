// components/admin/ProductSoldMap.tsx
"use client";
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProductSoldMap() {
  // Mock data cho đơn đặt xe
  const totalRenting = 125; // Đang chạy
  const totalFinished = 2896; // Hoàn thành
  const totalCancelled = 400; // Đã hủy
  const totalOrders = totalRenting + totalFinished + totalCancelled;

  // Tính phần trăm tăng trưởng so với tháng trước
  const growthPercentage = 28.5;

  const chartData = {
    labels: ["Đang chạy", "Hoàn thành", "Đã hủy"],
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
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Tổng số đơn đặt xe trong tháng
        </h3>
        <span
          className={`text-xs font-semibold ${
            growthPercentage >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {growthPercentage > 0 ? "+" : ""}
          {growthPercentage}%
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Biểu đồ Doughnut - Bên trái */}
        <div className="relative flex-shrink-0">
          <div className="relative h-28 w-28">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-gray-800">
                {totalOrders.toLocaleString("vi-VN")}
              </div>
              <div className="text-[10px] text-gray-500">Tổng đơn</div>
            </div>
          </div>
        </div>

        {/* Thống kê chi tiết - Bên phải */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
              <span className="text-xs text-gray-600">Đang chạy</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {totalRenting}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
              <span className="text-xs text-gray-600">Hoàn thành</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {totalFinished.toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
              <span className="text-xs text-gray-600">Đã hủy</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {totalCancelled}
            </span>
          </div>

          <div className="text-[10px] text-gray-500 pt-1">
            Tăng {Math.abs(growthPercentage)}% so với tháng trước
          </div>
        </div>
      </div>
    </div>
  );
}
