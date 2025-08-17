// components/admin/StatsCard.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  period: string;
  chartData: number[];
  chartColor: string;
}

export default function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
  iconBg,
  iconColor,
  period,
  chartData,
  chartColor,
}: StatsCardProps) {
  const chartOptions: ApexOptions = {
    chart: {
      type: "line",
      sparkline: { enabled: true },
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    colors: [chartColor],
    tooltip: { enabled: false },
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
        <span className="text-xs text-gray-500">{period}</span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {change && (
            <span
              className={`text-sm font-medium ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </div>

      <div className="h-16">
        <Chart
          options={chartOptions}
          series={[{ data: chartData }]}
          type="line"
          height="100%"
        />
      </div>
    </div>
  );
}
