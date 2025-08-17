// app/admin/dashboard/page.tsx
import { AdminLayout } from "@/layouts/AdminLayout";
import StatsCard from "./_component/StatsCard";
import ActiveUsersCard from "./_component/ActiveUsersCard";
import ProductSoldMap from "./_component/ProductSoldMap";
import TopProductsTable from "./_component/TopProductsTable";
import OrderHistoryCard from "./_component/OrderHistoryCard";
import WorldMap from "./_component/WorldMap";
import CouponCard from "./_component/CouponCard";
import { Car, Clock, FileText, CreditCard } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Tổng phương tiện đang hoạt động"
          value="850"
          change="+12%"
          trend="up"
          icon={<Car className="w-5 h-5" />}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
          period="So với tháng trước"
          chartData={[680, 720, 750, 780, 810, 830, 850]}
          chartColor="#06b6d4"
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
          chartData={[35, 28, 32, 25, 27, 20, 23]}
          chartColor="#f97316"
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
          chartData={[2500, 2800, 3000, 3100, 3200, 3350, 3421]}
          chartColor="#84cc16"
        />

        <StatsCard
          title="Yêu cầu rút tiền cần xử lý"
          value="8"
          change="+33%"
          trend="up"
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          period="So với tháng trước"
          chartData={[5, 6, 4, 7, 6, 9, 8]}
          chartColor="#eab308"
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Báo cáo từ người dùng */}
        <div className="lg:col-span-1">
          <WorldMap />
        </div>

        {/* Yêu cầu rút tiền */}
        <div className="lg:col-span-1">
          <TopProductsTable />
        </div>

        {/* Hợp đồng tất toán */}
        <div className="lg:col-span-1">
          <OrderHistoryCard />
        </div>

        {/* Mã giảm giá */}
        <div className="lg:col-span-1">
          <CouponCard />
        </div>
      </div>
    </div>
  );
}

AdminDashboard.Layout = AdminLayout;
