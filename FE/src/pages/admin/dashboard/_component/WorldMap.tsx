// components/admin/WorldMap.tsx
"use client";
import React from "react";
import { AlertTriangle, AlertCircle, ChevronRight, Clock } from "lucide-react";

export default function WorldMap() {
  // Mock data cho báo cáo
  const reportStats = {
    violation: {
      total: 24,
      pending: 18,
      resolved: 6,
      recent: [
        {
          id: 1,
          user: "Nguyễn Văn A",
          type: "Hủy đơn liên tục",
          time: "2 giờ trước",
        },
        {
          id: 2,
          user: "Trần Thị B",
          type: "Phản hồi chậm",
          time: "5 giờ trước",
        },
        {
          id: 3,
          user: "Lê Văn C",
          type: "Thông tin sai lệch",
          time: "1 ngày trước",
        },
      ],
    },
    serious: {
      total: 8,
      pending: 5,
      resolved: 3,
      recent: [
        {
          id: 1,
          user: "Phạm Văn D",
          type: "Xe không đúng mô tả",
          time: "30 phút trước",
        },
        {
          id: 2,
          user: "Hoàng Thị E",
          type: "Tai nạn không báo cáo",
          time: "3 giờ trước",
        },
      ],
    },
  };

  const totalPending =
    reportStats.violation.pending + reportStats.serious.pending;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Báo cáo từ người dùng
        </h3>
        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
          {totalPending} chờ xử lý
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Lỗi vi phạm */}
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-gray-700">Lỗi vi phạm</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {reportStats.violation.pending}
          </div>
          <div className="text-xs text-gray-600">
            Tổng: {reportStats.violation.total} | Đã xử lý:{" "}
            {reportStats.violation.resolved}
          </div>
        </div>

        {/* Lỗi nghiêm trọng */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-700">
                Lỗi nghiêm trọng
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 mb-1">
            {reportStats.serious.pending}
          </div>
          <div className="text-xs text-gray-600">
            Tổng: {reportStats.serious.total} | Đã xử lý:{" "}
            {reportStats.serious.resolved}
          </div>
        </div>
      </div>
    </div>
  );
}
