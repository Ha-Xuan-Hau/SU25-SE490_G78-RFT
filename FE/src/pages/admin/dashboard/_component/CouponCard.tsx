// components/admin/CouponCard.tsx
"use client";
import React from "react";
import { Tag, Clock, Percent, Calendar, Gift } from "lucide-react";

interface Coupon {
  id: string;
  name: string;
  discount: number;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  timeExpired: string;
}

export default function CouponCard() {
  // Mock data
  const activeCoupons: Coupon[] = [
    {
      id: "CP001",
      name: "NEWUSER50",
      discount: 50,
      description: "Giảm 50% cho người dùng mới",
      status: "active",
      createdAt: "2024-11-01",
      updatedAt: "2024-11-01",
      timeExpired: "2025-12-31",
    },
    {
      id: "CP002",
      name: "WINTER30",
      discount: 30,
      description: "Ưu đãi mùa đông giảm 30%",
      status: "active",
      createdAt: "2024-11-10",
      updatedAt: "2024-11-10",
      timeExpired: "2025-12-25",
    },
    {
      id: "CP003",
      name: "LOYAL20",
      discount: 20,
      description: "Khách hàng thân thiết giảm 20%",
      status: "active",
      createdAt: "2024-10-15",
      updatedAt: "2024-10-15",
      timeExpired: "2024-11-30",
    },
    {
      id: "CP004",
      name: "WEEKEND15",
      discount: 15,
      description: "Giảm 15% cuối tuần",
      status: "active",
      createdAt: "2024-11-12",
      updatedAt: "2024-11-12",
      timeExpired: "2024-11-24",
    },
  ];

  // Mock data cho expired coupons
  const expiredCoupons = 2; // Giả sử có 2 mã đã hết hạn
  const totalCoupons = activeCoupons.length + expiredCoupons;

  // Tính số ngày còn lại
  const getDaysRemaining = (expiredDate: string) => {
    const today = new Date();
    const expired = new Date(expiredDate);
    const diffTime = expired.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format ngày
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Thống kê
  const stats = {
    totalActive: activeCoupons.length,
    totalExpired: expiredCoupons,
    totalAll: totalCoupons,
  };

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
          <p className="text-xl font-bold text-blue-600">{stats.totalActive}</p>
          <p className="text-xs text-gray-600">Đang hoạt động</p>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <p className="text-xl font-bold text-orange-600">
            {stats.totalExpired}
          </p>
          <p className="text-xs text-gray-600">Đã hết hạn</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-600">{stats.totalAll}</p>
          <p className="text-xs text-gray-600">Tổng cộng</p>
        </div>
      </div>

      {/* Coupon List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activeCoupons.map((coupon) => {
          const daysRemaining = getDaysRemaining(coupon.timeExpired);
          const isExpiringSoon = daysRemaining <= 7;

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
                      {coupon.description}
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
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    HSD: {formatDate(coupon.timeExpired)}
                  </span>
                </div>
                <span
                  className={`flex items-center gap-1 font-medium ${
                    isExpiringSoon ? "text-orange-600" : "text-gray-600"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {daysRemaining > 0 ? `${daysRemaining} ngày` : "Hết hạn"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
