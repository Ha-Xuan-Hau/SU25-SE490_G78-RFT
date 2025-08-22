"use client";
import React, { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

export default function TopProductsTable() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waitingCount: 0,
    approvedCount: 0,
    totalApprovedAmount: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWithdrawalData();
  }, []);

  const fetchWithdrawalData = async () => {
    try {
      setLoading(true);
      // Lấy dữ liệu tháng hiện tại
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const from = startOfMonth.toISOString().split("T")[0];
      const to = today.toISOString().split("T")[0];

      const response = await dashboardAPI.getWithdrawalStats(from, to);
      setStats(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching withdrawal data:", err);
    } finally {
      setLoading(false);
    }
  };

  interface WithdrawalStats {
    waitingCount: number;
    approvedCount: number;
    totalApprovedAmount: number;
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Yêu cầu rút tiền
          </h3>
          {stats.waitingCount > 0 && (
            <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-1 rounded-full">
              {stats.waitingCount} chờ xử lý
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
                {stats.waitingCount}
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
                {stats.approvedCount}
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
                {formatCurrency(stats.totalApprovedAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
