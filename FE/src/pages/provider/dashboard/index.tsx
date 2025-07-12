import UserProfileCard from "./_component/user-profile-card";
import CarStatsCard from "./_component/car-stats-card";
import OrderIncomeCard from "./_component/order-income-card";
import BusinessRegistrationCard from "./_component/business-registration-card";
import { Car, Key, Gauge, CarFront } from "lucide-react";
import ProviderLayout from "@/layouts/ProviderLayout";

export default function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 lg:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <UserProfileCard />
        </div>

        {/* Car Stats Cards */}
        <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CarStatsCard
            title="Xe hoạt động"
            value="150"
            icon={Car}
            bgColor="bg-green-500"
            textColor="text-white"
          />
          <CarStatsCard
            title="Xe đang thuê"
            value="80"
            icon={Key}
            bgColor="bg-blue-600"
            textColor="text-white"
          />
          <CarStatsCard
            title="Xe đang chạy"
            value="65"
            icon={Gauge}
            bgColor="bg-teal-500"
            textColor="text-white"
          />
          <CarStatsCard
            title="Tổng tất cả xe"
            value="200"
            icon={CarFront}
            bgColor="bg-yellow-500"
            textColor="text-white"
          />
        </div>

        {/* Order & Income Card */}
        <div className="lg:col-span-2 xl:col-span-2">
          <OrderIncomeCard />
        </div>

        {/* Business Registration Card */}
        <div className="lg:col-span-1 xl:col-span-2">
          <BusinessRegistrationCard />
        </div>
      </div>
    </div>
  );
}

ProviderDashboard.layout = ProviderLayout;
