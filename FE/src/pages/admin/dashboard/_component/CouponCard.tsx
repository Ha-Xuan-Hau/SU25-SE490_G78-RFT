"use client";
import React, { useEffect, useState } from "react";
import { Tag, Clock, Percent, Calendar, Gift } from "lucide-react";
import { dashboardAPI } from "@/apis/admin.api";

interface CouponItem {
  id: string;
  name: string;
  discount: number;
  description: string;
  status: string;
  timeExpired: string;
  daysLeft: number | null;
}

interface CouponSummary {
  totalActive: number;
  totalExpired: number;
  totalAll: number;
}

export default function CouponCard() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [summary, setSummary] = useState<CouponSummary>({
    totalActive: 0,
    totalExpired: 0,
    totalAll: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCouponData();
  }, []);

  const fetchCouponData = async () => {
    try {
      setLoading(true);
      // Lấy tất cả coupons (không filter theo ngày)
      const response = await dashboardAPI.getCoupons();

      if (response.items) {
        setCoupons(response.items);
      }

      if (response.summary) {
        setSummary(response.summary);
      } else {
        // Tính toán summary từ items nếu backend không trả về
        const activeCoupons: CouponItem[] =
          response.items?.filter((c: CouponItem) => c.status === "VALID") || [];
        const expiredCoupons: CouponItem[] =
          response.items?.filter((c: CouponItem) => c.status === "EXPIRED") ||
          [];
        setSummary({
          totalActive: activeCoupons.length,
          totalExpired: expiredCoupons.length,
          totalAll: response.items?.length || 0,
        });
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching coupon data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Format ngày
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Lọc chỉ lấy coupons đang hoạt động
  const activeCoupons = coupons.filter((c) => c.status === "VALID");

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Mã giảm giá</h3>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xl font-bold text-blue-600">
            {summary.totalActive}
          </p>
          <p className="text-xs text-gray-600">Đang hoạt động</p>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <p className="text-xl font-bold text-orange-600">
            {summary.totalExpired}
          </p>
          <p className="text-xs text-gray-600">Đã hết hạn</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-600">{summary.totalAll}</p>
          <p className="text-xs text-gray-600">Tổng cộng</p>
        </div>
      </div>

      {/* Coupon List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activeCoupons.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Không có mã giảm giá nào đang hoạt động
          </div>
        ) : (
          activeCoupons.map((coupon) => {
            const isExpiringSoon =
              coupon.daysLeft !== null && coupon.daysLeft <= 7;

            return (
              <div
                key={coupon.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                  isExpiringSoon
                    ? "border-orange-200 bg-orange-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                {/* Coupon Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isExpiringSoon ? "bg-orange-100" : "bg-green-100"
                      }`}
                    >
                      <Gift
                        className={`w-4 h-4 ${
                          isExpiringSoon ? "text-orange-600" : "text-green-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {coupon.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {coupon.description || "Mã giảm giá"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      coupon.discount >= 30 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    -{coupon.discount}%
                  </span>
                </div>

                {/* Coupon Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {coupon.id}
                    </span>
                    {coupon.timeExpired && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        HSD: {formatDate(coupon.timeExpired)}
                      </span>
                    )}
                  </div>
                  {coupon.daysLeft !== null && (
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        isExpiringSoon ? "text-orange-600" : "text-gray-600"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {coupon.daysLeft > 0
                        ? `${coupon.daysLeft} ngày`
                        : "Hết hạn"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
