// app/admin/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import StatsCard from "./_component/StatsCard";
import ActiveUsersCard from "./_component/ActiveUsersCard";
import ProductSoldMap from "./_component/BookingCard";
import TopProductsTable from "./_component/WithdrawalCard";
import OrderHistoryCard from "./_component/FinalizedContractCard";
import WorldMap from "./_component/ReportCard";
import CouponCard from "./_component/CouponCard";
import VehicleStatsCard from "./_component/VehicleStatsCard";
import { Car, Clock, FileText, CreditCard } from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

export default function AdminDashboard() {
  const [totalBookings, setTotalBookings] = useState({
    current: 0,
    previous: 0,
    loading: true,
  });

  const [withdrawalPending, setWithdrawalPending] = useState({
    count: 0,
    loading: true,
  });

  const [vehicleStats, setVehicleStats] = useState({
    activeVehicles: 0,
    totalVehicles: 0,
    pendingVehicles: 0,
    pendingChangePercent: 0,
    loading: true,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchTotalBookings(),
      fetchWithdrawalPending(),
      fetchVehicleStats(),
    ]);
  };

  const fetchVehicleStats = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await dashboardAPI.getVehicleUserSummary(currentMonth);

      if (response.overview) {
        setVehicleStats({
          activeVehicles: response.overview.activeVehicles,
          totalVehicles: response.overview.totalVehicles,
          pendingVehicles: response.overview.pendingVehicles,
          pendingChangePercent: response.overview.pendingChangePercent,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching vehicle stats:", error);
      setVehicleStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchTotalBookings = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthStr = previousMonth.toISOString().slice(0, 7);

      const [current, previous] = await Promise.all([
        dashboardAPI.getMonthlyTotalBookings(currentMonth),
        dashboardAPI.getMonthlyTotalBookings(previousMonthStr),
      ]);

      setTotalBookings({
        current: current.total,
        previous: previous.total,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching total bookings:", error);
      setTotalBookings((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchWithdrawalPending = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const from = startOfMonth.toISOString().split("T")[0];
      const to = today.toISOString().split("T")[0];

      const response = await dashboardAPI.getWithdrawalStats(from, to);
      setWithdrawalPending({
        count: response.waitingCount,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching withdrawal data:", error);
      setWithdrawalPending((prev) => ({ ...prev, loading: false }));
    }
  };

  const calculateGrowthPercentage = () => {
    if (totalBookings.previous === 0 && totalBookings.current === 0) {
      return 0;
    } else if (totalBookings.previous === 0 && totalBookings.current > 0) {
      return 100; // Tháng trước = 0, tháng này > 0 => +100%
    } else if (totalBookings.previous > 0 && totalBookings.current === 0) {
      return -100; // Tháng trước > 0, tháng này = 0 => -100%
    } else {
      return Math.round(
        ((totalBookings.current - totalBookings.previous) /
          totalBookings.previous) *
          100
      );
    }
  };

  const growthPercentage = calculateGrowthPercentage();

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Tổng phương tiện đang hoạt động"
          value={
            vehicleStats.loading
              ? "..."
              : vehicleStats.activeVehicles.toLocaleString("vi-VN")
          }
          change=""
          trend="neutral"
          icon={<Car className="w-5 h-5" />}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
          period={
            vehicleStats.loading
              ? "Đang tải..."
              : `Trên tổng số ${vehicleStats.totalVehicles} xe`
          }
        />

        <StatsCard
          title="Số lượng xe đang chờ duyệt"
          value={
            vehicleStats.loading
              ? "..."
              : vehicleStats.pendingVehicles.toString()
          }
          change={
            vehicleStats.loading
              ? ""
              : vehicleStats.pendingChangePercent !== 0
              ? `${
                  vehicleStats.pendingChangePercent > 0 ? "+" : ""
                }${vehicleStats.pendingChangePercent.toFixed(0)}%`
              : ""
          }
          trend={
            vehicleStats.pendingChangePercent > 0
              ? "up"
              : vehicleStats.pendingChangePercent < 0
              ? "down"
              : "neutral"
          }
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          period=""
        />

        <StatsCard
          title="Tổng đơn đặt xe"
          value={
            totalBookings.loading
              ? "..."
              : totalBookings.current.toLocaleString("vi-VN")
          }
          change={
            totalBookings.loading
              ? ""
              : `${growthPercentage > 0 ? "+" : ""}${growthPercentage}%`
          }
          trend={
            growthPercentage > 0
              ? "up"
              : growthPercentage < 0
              ? "down"
              : "neutral"
          }
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          period="So với tháng trước"
        />

        <StatsCard
          title="Yêu cầu rút tiền cần xử lý"
          value={
            withdrawalPending.loading
              ? "..."
              : withdrawalPending.count.toString()
          }
          change=""
          trend={withdrawalPending.count > 0 ? "up" : "neutral"}
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          period=""
        />
      </div>

      {/* Main Content - 3 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1: Tổng người dùng & Phương tiện trong hệ thống */}
        <div className="space-y-6">
          <ActiveUsersCard />
          <VehicleStatsCard />
        </div>

        {/* Cột 2: Tổng số đơn đặt xe, Báo cáo từ người dùng, Mã giảm giá */}
        <div className="space-y-6">
          <ProductSoldMap />
          <WorldMap />
          <CouponCard />
        </div>

        {/* Cột 3: Hợp đồng tất toán & Yêu cầu rút tiền */}
        <div className="space-y-6">
          <OrderHistoryCard />
          <TopProductsTable />
        </div>
      </div>
    </div>
  );
}

AdminDashboard.Layout = AdminLayout;
