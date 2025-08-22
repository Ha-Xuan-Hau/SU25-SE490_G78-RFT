"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, ChevronRight, Clock } from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

export default function WorldMap() {
  const [loading, setLoading] = useState(true);
  const [reportStats, setReportStats] = useState({
    pendingTotal: 0,
    nonSerious: {
      total: 0,
      pending: 0,
      processed: 0,
    },
    serious: {
      total: 0,
      pending: 0,
      processed: 0,
    },
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Lấy dữ liệu tháng hiện tại
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const from = startOfMonth.toISOString().split("T")[0];
      const to = today.toISOString().split("T")[0];

      const response = await dashboardAPI.getReportStatistics(from, to);
      setReportStats(response);
      setError(null);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Báo cáo từ người dùng
        </h3>
        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
          {reportStats.pendingTotal} chờ xử lý
        </span>
      </div>

      {/* Stats Cards - Stacked Rows */}
      <div className="space-y-3 mb-4">
        {/* Lỗi vi phạm */}
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-700">Lỗi vi phạm</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {reportStats.nonSerious.pending}
              </div>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div>Tổng: {reportStats.nonSerious.total}</div>
              <div>Đã xử lý: {reportStats.nonSerious.processed}</div>
            </div>
          </div>
        </div>

        {/* Lỗi nghiêm trọng */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-700">
                  Lỗi nghiêm trọng
                </span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {reportStats.serious.pending}
              </div>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div>Tổng: {reportStats.serious.total}</div>
              <div>Đã xử lý: {reportStats.serious.processed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
