// app/admin/dashboard/_component/VehicleStatsCard.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Car,
  Bike,
  CircleDot,
  Lock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

// Define interfaces for type safety
interface VehicleStats {
  active: number;
  pending: number;
  suspended: number;
  deleted: number;
  total: number;
  activePercent: number;
  pendingPercent: number;
  suspendedPercent: number;
  deletedPercent: number;
}

interface VehicleTypeItem {
  type: string;
  active: number;
  total: number;
  pending: number; // Thêm field pending
  suspended: number; // Thêm field suspended
  providers?: number;
}

interface VehicleData {
  vehicles: VehicleStats;
  vehicleTypes: VehicleTypeItem[];
}

export default function VehicleStatsCard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    vehicles: {
      active: 0,
      pending: 0,
      suspended: 0,
      deleted: 0,
      total: 0,
      activePercent: 0,
      pendingPercent: 0,
      suspendedPercent: 0,
      deletedPercent: 0,
    },
    vehicleTypes: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicleData();
  }, []);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await dashboardAPI.getVehicleUserSummary(currentMonth);

      if (response.vehicles && response.vehicleTypes) {
        setVehicleData({
          vehicles: response.vehicles,
          vehicleTypes: response.vehicleTypes,
        });
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching vehicle data:", err);
      setError("Không thể tải dữ liệu phương tiện");
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "CAR":
        return <Car className="w-4 h-4 text-blue-600" />;
      case "MOTORBIKE":
        return <Bike className="w-4 h-4 text-green-600" />;
      case "BICYCLE":
        return <CircleDot className="w-4 h-4 text-purple-600" />;
      default:
        return <Car className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVehicleColor = (type: string): string => {
    switch (type?.toUpperCase()) {
      case "CAR":
        return "bg-blue-100";
      case "MOTORBIKE":
        return "bg-green-100";
      case "BICYCLE":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const getVehicleName = (type: string): string => {
    switch (type?.toUpperCase()) {
      case "CAR":
        return "Ô tô";
      case "MOTORBIKE":
        return "Xe máy";
      case "BICYCLE":
        return "Xe đạp";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
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

  const { vehicles, vehicleTypes } = vehicleData;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Phương tiện trong hệ thống
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Tổng cộng: {vehicles.total} phương tiện
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Đang hoạt động</span>
          </div>
          <p className="text-xl font-bold text-green-600">{vehicles.active}</p>
          <p className="text-xs text-gray-500">
            {vehicles.activePercent.toFixed(1)}%
          </p>
        </div>

        <div className="p-2 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-600">Chờ duyệt</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">
            {vehicles.pending}
          </p>
          <p className="text-xs text-gray-500">
            {vehicles.pendingPercent.toFixed(1)}%
          </p>
        </div>

        <div className="p-2 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Tạm khóa</span>
          </div>
          <p className="text-xl font-bold text-orange-600">
            {vehicles.suspended}
          </p>
          <p className="text-xs text-gray-500">
            {vehicles.suspendedPercent.toFixed(1)}%
          </p>
        </div>

        <div className="p-2 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-600">Đã xóa</span>
          </div>
          <p className="text-xl font-bold text-red-600">{vehicles.deleted}</p>
          <p className="text-xs text-gray-500">
            {vehicles.deletedPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Vehicle Types */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Phân loại phương tiện
        </p>
        <div className="space-y-3">
          {vehicleTypes.map((vehicleType: VehicleTypeItem, index: number) => {
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 ${getVehicleColor(
                      vehicleType.type
                    )} rounded-lg flex items-center justify-center`}
                  >
                    {getVehicleIcon(vehicleType.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getVehicleName(vehicleType.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {vehicleType.active}/{vehicleType.total} hoạt động
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {vehicleType.total}
                  </p>
                  <div className="flex gap-1 justify-end">
                    {vehicleType.pending > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                        {vehicleType.pending} chờ duyệt
                      </span>
                    )}
                    {vehicleType.suspended > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                        {vehicleType.suspended} tạm khóa
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
