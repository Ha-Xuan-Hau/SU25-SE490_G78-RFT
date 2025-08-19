// components/admin/ActiveUsersCard.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Users, UserPlus, Car } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ActiveUsersCard() {
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

  // Mock data
  const totalUsers = 12847;
  const newUsersLast30Days = 1256;
  const totalCarOwners = 3421;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tổng người dùng</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-bold text-gray-900">
            {totalUsers.toLocaleString("vi-VN")}
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
            +{newUsersLast30Days} người dùng mới
          </span>
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
              <p className="text-xs opacity-90">Tổng số người dùng </p>
            </div>
            <p className="text-2xl font-bold">
              {(totalUsers - totalCarOwners).toLocaleString("vi-VN")}
            </p>
            <p className="text-xs opacity-80 mt-1">
              <span className="text-green-300">↑ 12.5%</span> so với tháng trước
            </p>
          </div>

          {/* Car Owners */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-4 h-4" />
              <p className="text-xs opacity-90">Tổng số chủ xe cho thuê</p>
            </div>
            <p className="text-2xl font-bold">
              {totalCarOwners.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs opacity-80 mt-1">
              <span className="text-green-300">↑ 8.3%</span> so với tháng trước
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
