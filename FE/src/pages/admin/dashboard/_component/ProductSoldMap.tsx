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
    cutout: "80%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Tổng số đơn đặt xe trong tháng
        </h3>
        <select className="text-sm border rounded-lg px-3 py-1 text-gray-600">
          <option>Tháng này</option>
          <option>Tháng trước</option>
          <option>3 tháng gần nhất</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Thống kê chi tiết */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span>
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {totalRenting}
            </span>
            <span className="text-gray-600">Đơn đang chạy</span>
          </div>

          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-3"></span>
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {totalFinished.toLocaleString("vi-VN")}
            </span>
            <span className="text-gray-600">Đơn hoàn thành</span>
          </div>

          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-3"></span>
            <span className="text-2xl font-bold text-gray-800 mr-2">
              {totalCancelled}
            </span>
            <span className="text-gray-600">Đơn đã hủy</span>
          </div>

          {/* Phần trăm tăng trưởng */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <span
                className={`font-bold text-lg ${
                  growthPercentage >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {growthPercentage > 0 ? "+" : ""}
                {growthPercentage}%
              </span>
              <span className="ml-2">
                {growthPercentage >= 0 ? "Tăng" : "Giảm"} so với tháng trước
              </span>
            </p>
          </div>
        </div>

        {/* Biểu đồ Doughnut */}
        <div className="relative flex items-center justify-center">
          <div className="relative h-48 w-48">
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-800">
                {totalOrders.toLocaleString("vi-VN")}
              </div>
              <div className="text-sm text-gray-500">Tổng đơn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
