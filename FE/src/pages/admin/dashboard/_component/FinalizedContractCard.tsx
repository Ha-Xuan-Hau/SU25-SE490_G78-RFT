// app/admin/dashboard/_component/FinalizedContractCard.tsx
"use client";
import React, { useEffect, useState } from "react";
import { FileCheck, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

interface Stats {
  totalContracts: number;
  totalValue: number;
  avgDuration: number;
  todayContracts: number;
  growthRate: number | null; // có thể null khi không tính được
  growthDisplay: string; // text hiển thị
}

export default function OrderHistoryCard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalContracts: 0,
    totalValue: 0,
    avgDuration: 0,
    todayContracts: 0,
    growthRate: null,
    growthDisplay: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthStr = previousMonth.toISOString().slice(0, 7);

      // Fetch all data in parallel
      const [settlements, settlementAmount, avgDuration, previousSettlements] =
        await Promise.all([
          dashboardAPI.getTotalSettlements(currentMonth),
          dashboardAPI.getTotalSettlementAmount(currentMonth),
          dashboardAPI.getAverageRentalDuration(currentMonth),
          dashboardAPI.getTotalSettlements(previousMonthStr),
        ]);

      // Calculate growth rate với logic đúng
      let growthRate: number | null = null;
      let growthDisplay = "";

      if (previousSettlements.total === 0 && settlements.total === 0) {
        // Cả 2 tháng đều = 0
        growthRate = 0;
        growthDisplay = "0%";
      } else if (previousSettlements.total === 0 && settlements.total > 0) {
        // Tháng trước = 0, tháng này > 0 => tăng 100% (hoặc "Mới")
        growthRate = 100;
        growthDisplay = "+100%"; // hoặc "+100%" tùy bạn muốn hiển thị
      } else if (previousSettlements.total > 0 && settlements.total === 0) {
        // Tháng trước > 0, tháng này = 0 => giảm 100%
        growthRate = -100;
        growthDisplay = "-100%";
      } else {
        // Cả 2 đều > 0, tính bình thường
        growthRate =
          ((settlements.total - previousSettlements.total) /
            previousSettlements.total) *
          100;
        growthDisplay = `${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}%`;
      }

      // Calculate today's contracts
      const today = new Date().toISOString().split("T")[0];
      const todayContracts = Math.floor(settlements.total / 30); // Rough estimate

      setStats({
        totalContracts: settlements.total,
        totalValue: settlementAmount.amount,
        avgDuration: avgDuration.days,
        todayContracts: todayContracts,
        growthRate: growthRate,
        growthDisplay: growthDisplay,
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching contract data:", err);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

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

  // Xác định màu sắc dựa trên growthRate
  const getGrowthColor = () => {
    if (stats.growthRate === null) return "text-gray-600";
    if (stats.growthRate > 0) return "text-green-600";
    if (stats.growthRate < 0) return "text-red-600";
    return "text-gray-600";
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
            <span className={`text-sm font-medium ${getGrowthColor()}`}>
              {stats.growthDisplay}
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
              <p className="text-sm text-gray-600">Thời gian thuê trung bình</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgDuration.toFixed(1)} ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
