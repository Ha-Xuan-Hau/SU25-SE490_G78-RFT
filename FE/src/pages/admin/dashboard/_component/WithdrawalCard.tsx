// components/admin/TopProductsTable.tsx
"use client";
import React from "react";
import { CreditCard, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function TopProductsTable() {
  // Mock data - chỉ số liệu thống kê
  const stats = {
    pending: 8, // Đang chờ xử lý
    processed: 156, // Đã xử lý trong tháng
    totalAmount: 285000000, // Tổng tiền đã xử lý
    avgProcessTime: "2.5", // Thời gian xử lý trung bình (giờ)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Yêu cầu rút tiền
          </h3>
          {stats.pending > 0 && (
            <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-1 rounded-full">
              {stats.pending} chờ xử lý
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Thống kê tháng này</p>
      </div>

      {/* Main Stats */}
      <div className="space-y-4">
        {/* Pending Requests */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đang chờ xử lý</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
          <span className="text-xs text-orange-600 font-medium">Cần xử lý</span>
        </div>

        {/* Processed Requests */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã xử lý</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.processed}
              </p>
            </div>
          </div>
          <span className="text-xs text-green-600 font-medium">Tháng này</span>
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng tiền đã xử lý</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
