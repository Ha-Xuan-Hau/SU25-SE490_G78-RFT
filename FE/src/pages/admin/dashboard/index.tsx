// app/admin/dashboard/page.tsx
import { AdminLayout } from "@/layouts/AdminLayout";
import StatsCard from "./_component/StatsCard";
import ActiveUsersCard from "./_component/ActiveUsersCard";
import ProductSoldMap from "./_component/BookingCard";
import TopProductsTable from "./_component/WithdrawalCard";
import OrderHistoryCard from "./_component/FinalizedContractCard";
import WorldMap from "./_component/ReportCard";
import CouponCard from "./_component/CouponCard";
import VehicleStatsCard from "./_component/VehicleStatsCard";
import { Car, Clock, FileText, CreditCard } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Tổng phương tiện đang hoạt động"
          value="720"
          change=""
          trend="neutral"
          icon={<Car className="w-5 h-5" />}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
          period="Trên tổng số 850 xe"
        />

        <StatsCard
          title="Số lượng xe đang chờ duyệt"
          value="23"
          change="-15%"
          trend="down"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          period="So với tháng trước"
        />

        <StatsCard
          title="Tổng đơn đặt xe"
          value="3,421"
          change="+28%"
          trend="up"
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          period="So với tháng trước"
        />

        <StatsCard
          title="Yêu cầu rút tiền cần xử lý"
          value="8"
          change=""
          trend="up"
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          period=""
        />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Users */}
        <div className="lg:col-span-1">
          <ActiveUsersCard />
        </div>

        {/* Product Sold Map */}
        <div className="lg:col-span-2">
          <ProductSoldMap />
        </div>
      </div>

      {/* Bottom Section - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Phương tiện */}
        <div>
          <VehicleStatsCard />
        </div>
        {/* Column 2: Báo cáo & Hợp đồng */}
        <div className="space-y-6">
          <WorldMap />
          <OrderHistoryCard />
        </div>

        {/* Column 3: Mã giảm giá & Yêu cầu rút tiền */}
        <div className="space-y-6">
          <TopProductsTable />
          <CouponCard />
        </div>
      </div>
    </div>
  );
}

AdminDashboard.Layout = AdminLayout;
