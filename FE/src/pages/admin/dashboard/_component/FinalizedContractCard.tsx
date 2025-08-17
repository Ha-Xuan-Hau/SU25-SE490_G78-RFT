// components/admin/OrderHistoryCard.tsx
"use client";
import React from "react";
import { FileCheck, TrendingUp, Calendar, DollarSign } from "lucide-react";

export default function OrderHistoryCard() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Thống kê
  const stats = {
    totalContracts: 342, // Tổng hợp đồng trong tháng
    totalValue: 485000000, // Tổng giá trị
    avgDuration: "2.5", // Thời gian thuê trung bình (ngày)
    todayContracts: 12, // Hợp đồng hôm nay
    growthRate: 15.2, // Tăng trưởng so với tháng trước
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Hợp đồng tất toán
          </h3>
          <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
            {stats.todayContracts} hôm nay
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Thống kê tháng này</p>
      </div>

      {/* Statistics Cards */}
      <div className="space-y-3">
        {/* Total Contracts */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng hợp đồng</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalContracts}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-sm font-medium ${
                stats.growthRate >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.growthRate > 0 ? "+" : ""}
              {stats.growthRate}%
            </span>
            <p className="text-xs text-gray-500">so với tháng trước</p>
          </div>
        </div>

        {/* Total Value */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng giá trị tất toán</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Average Duration */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thời gian thuê trung bính</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgDuration} ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
