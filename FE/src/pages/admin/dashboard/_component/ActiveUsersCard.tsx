// app/admin/dashboard/_component/ActiveUsersCard.tsx
"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Users, UserPlus, Car } from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ActiveUsersCard() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    totalUsers: 0,
    newUsersLast30Days: 0,
    usersChangePercent: 0,
    totalProviders: 0,
    providersChangePercent: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const response = await dashboardAPI.getVehicleUserSummary(currentMonth);

      if (response.users) {
        setUserData(response.users);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        columnWidth: "40%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#ffffff",
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      show: false,
    },
    grid: {
      show: false,
    },
    colors: ["#ffffff"],
    tooltip: {
      y: {
        formatter: (val) => `${val} người dùng`,
      },
    },
  };

  const series = [
    {
      name: "Người dùng hoạt động",
      data: [200, 160, 150, 180, 140, 170, 190],
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
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

  const regularUsers = userData.totalUsers - userData.totalProviders;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tổng người dùng</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-bold text-gray-900">
            {userData.totalUsers.toLocaleString("vi-VN")}
          </span>
          <span className="text-sm text-gray-500">
            Người dùng trong hệ thống
          </span>
        </div>
      </div>

      {/* New Users in 30 days */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Số người dùng mới trong 30 ngày qua
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-green-600">
            +{userData.newUsersLast30Days} người dùng mới
          </span>
          {userData.usersChangePercent !== 0 && (
            <span
              className={`text-xs ${
                userData.usersChangePercent > 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ({userData.usersChangePercent > 0 ? "+" : ""}
              {userData.usersChangePercent.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-gradient-to-r from-cyan-500 to-primary rounded-lg p-4 text-white">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Total Users */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" />
              <p className="text-xs opacity-90">Tổng số người dùng</p>
            </div>
            <p className="text-2xl font-bold">
              {regularUsers.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs opacity-80 mt-1">
              {userData.usersChangePercent !== 0 && (
                <span
                  className={
                    userData.usersChangePercent > 0
                      ? "text-green-300"
                      : "text-red-300"
                  }
                >
                  {userData.usersChangePercent > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(userData.usersChangePercent).toFixed(1)}%
                </span>
              )}
              {userData.usersChangePercent !== 0 && " so với tháng trước"}
            </p>
          </div>

          {/* Car Owners */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-4 h-4" />
              <p className="text-xs opacity-90">Tổng số chủ xe cho thuê</p>
            </div>
            <p className="text-2xl font-bold">
              {userData.totalProviders.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs opacity-80 mt-1">
              {userData.providersChangePercent !== 0 && (
                <span
                  className={
                    userData.providersChangePercent > 0
                      ? "text-green-300"
                      : "text-red-300"
                  }
                >
                  {userData.providersChangePercent > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(userData.providersChangePercent).toFixed(1)}%
                </span>
              )}
              {userData.providersChangePercent !== 0 && " so với tháng trước"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
