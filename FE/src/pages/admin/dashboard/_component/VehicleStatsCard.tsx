// components/admin/VehicleStatsCard.tsx
"use client";
import React from "react";
import {
  Car,
  Bike,
  CircleDot,
  Lock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function VehicleStatsCard() {
  // Mock data
  const vehicleStats = {
    byType: {
      car: {
        total: 150,
        available: 120,
        pending: 20,
        suspended: 8,
        unavailable: 2,
      },
      motorbike: {
        total: 500,
        available: 420,
        pending: 50,
        suspended: 25,
        unavailable: 5,
      },
      bicycle: {
        total: 200,
        available: 180,
        pending: 10,
        suspended: 8,
        unavailable: 2,
      },
    },
    total: {
      all: 850,
      available: 720,
      pending: 80,
      suspended: 41,
      unavailable: 9,
    },
  };

  // Tính phần trăm
  const getPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Phương tiện trong hệ thống
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Tổng cộng: {vehicleStats.total.all} phương tiện
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Đang hoạt động</span>
          </div>
          <p className="text-xl font-bold text-green-600">
            {vehicleStats.total.available}
          </p>
          <p className="text-xs text-gray-500">
            {getPercentage(
              vehicleStats.total.available,
              vehicleStats.total.all
            )}
            %
          </p>
        </div>

        <div className="p-2 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-600">Chờ duyệt</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">
            {vehicleStats.total.pending}
          </p>
          <p className="text-xs text-gray-500">
            {getPercentage(vehicleStats.total.pending, vehicleStats.total.all)}%
          </p>
        </div>

        <div className="p-2 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Tạm khóa</span>
          </div>
          <p className="text-xl font-bold text-orange-600">
            {vehicleStats.total.suspended}
          </p>
          <p className="text-xs text-gray-500">
            {getPercentage(
              vehicleStats.total.suspended,
              vehicleStats.total.all
            )}
            %
          </p>
        </div>

        <div className="p-2 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-600">Đã xóa</span>
          </div>
          <p className="text-xl font-bold text-red-600">
            {vehicleStats.total.unavailable}
          </p>
          <p className="text-xs text-gray-500">
            {getPercentage(
              vehicleStats.total.unavailable,
              vehicleStats.total.all
            )}
            %
          </p>
        </div>
      </div>

      {/* Vehicle Types */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Phân loại phương tiện
        </p>
        <div className="space-y-3">
          {/* Ô tô */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ô tô</p>
                <p className="text-xs text-gray-500">
                  {vehicleStats.byType.car.available}/
                  {vehicleStats.byType.car.total} hoạt động
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {vehicleStats.byType.car.total}
              </p>
              <div className="flex gap-1 justify-end">
                {vehicleStats.byType.car.pending > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                    {vehicleStats.byType.car.pending} chờ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Xe máy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Bike className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Xe máy</p>
                <p className="text-xs text-gray-500">
                  {vehicleStats.byType.motorbike.available}/
                  {vehicleStats.byType.motorbike.total} hoạt động
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {vehicleStats.byType.motorbike.total}
              </p>
              <div className="flex gap-1 justify-end">
                {vehicleStats.byType.motorbike.pending > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                    {vehicleStats.byType.motorbike.pending} chờ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Xe đạp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CircleDot className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Xe đạp</p>
                <p className="text-xs text-gray-500">
                  {vehicleStats.byType.bicycle.available}/
                  {vehicleStats.byType.bicycle.total} hoạt động
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {vehicleStats.byType.bicycle.total}
              </p>
              <div className="flex gap-1 justify-end">
                {vehicleStats.byType.bicycle.pending > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                    {vehicleStats.byType.bicycle.pending} chờ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
