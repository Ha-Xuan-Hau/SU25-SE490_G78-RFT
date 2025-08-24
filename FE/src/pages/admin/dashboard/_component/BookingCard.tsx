// app/admin/dashboard/_component/BookingCard.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { dashboardAPI } from "@/apis/admin.api";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProductSoldMap() {
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    running: 0,
    completed: 0,
    canceled: 0,
    total: 0,
  });
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    try {
      setLoading(true);

      // Lấy dữ liệu tháng hiện tại
      const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const summaryResponse = await dashboardAPI.getMonthlyBookingSummary(
        currentMonth
      );

      // Lấy dữ liệu tháng trước để tính tăng trưởng
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthStr = previousMonth.toISOString().slice(0, 7);
      const previousResponse = await dashboardAPI.getMonthlyTotalBookings(
        previousMonthStr
      );

      setBookingData(summaryResponse);
      setPreviousMonthTotal(previousResponse.total);
      setError(null);
    } catch (err) {
      console.error("Error fetching booking data:", err);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Tính phần trăm tăng trưởng - LOGIC MỚI
  const calculateGrowthPercentage = () => {
    if (previousMonthTotal === 0 && bookingData.total === 0) {
      return "0";
    } else if (previousMonthTotal === 0 && bookingData.total > 0) {
      return "100"; // Tháng trước = 0, tháng này > 0 => +100%
    } else if (previousMonthTotal > 0 && bookingData.total === 0) {
      return "-100"; // Tháng trước > 0, tháng này = 0 => -100%
    } else {
      return (
        ((bookingData.total - previousMonthTotal) / previousMonthTotal) *
        100
      ).toFixed(1);
    }
  };

  const growthPercentage = parseFloat(calculateGrowthPercentage());

  const chartData = {
    labels: ["Đang chạy", "Hoàn thành", "Đã hủy"],
    datasets: [
      {
        data: [
          bookingData.running,
          bookingData.completed,
          bookingData.canceled,
        ],
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-28 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

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
                {bookingData.total.toLocaleString("vi-VN")}
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
              {bookingData.running}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
              <span className="text-xs text-gray-600">Hoàn thành</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {bookingData.completed.toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
              <span className="text-xs text-gray-600">Đã hủy</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {bookingData.canceled}
            </span>
          </div>

          <div className="text-[10px] text-gray-500 pt-1">
            {growthPercentage >= 0 ? "Tăng" : "Giảm"}{" "}
            {Math.abs(growthPercentage)}% so với tháng trước
          </div>
        </div>
      </div>
    </div>
  );
}
