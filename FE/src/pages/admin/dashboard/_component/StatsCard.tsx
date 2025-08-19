"use client";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  period: string;
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
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm  transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{period}</span>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {trend === "up" && <TrendingUp className="w-4 h-4" />}
            {trend === "down" && <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
