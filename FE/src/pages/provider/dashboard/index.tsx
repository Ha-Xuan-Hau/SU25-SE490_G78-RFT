import UserProfileCard from "./_component/user-profile-card";
import CarStatsCard from "./_component/car-stats-card";
import OrderIncomeCard from "./_component/order-income-card";
import BusinessRegistrationCard from "./_component/business-registration-card";
import { Car, Key, Gauge, CarFront } from "lucide-react";
import ProviderLayout from "@/layouts/ProviderLayout";
import CarStatsGridCard from "./_component/car-stats-grid-card";

export default function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 lg:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3 section: Profile, Car Stats, and Order/Income */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top row: Profile and Car Stats */}
          <div className="md:col-span-1">
            <UserProfileCard />
          </div>
          <div className="md:col-span-1 grid grid-cols-2 gap-6">
            <CarStatsCard
              title="Xe hoạt động"
              value="150"
              icon={Car}
              bgColor="bg-green-500"
            />
            <CarStatsCard
              title="Xe đang thuê"
              value="80"
              icon={Key}
              bgColor="bg-blue-600"
            />
            <CarStatsCard
              title="Xe đang chạy"
              value="65"
              icon={Gauge}
              bgColor="bg-teal-500"
            />
            <CarStatsCard
              title="Tổng tất cả xe"
              value="200"
              icon={CarFront}
              bgColor="bg-yellow-500"
            />
          </div>
          {/* Bottom row: Order & Income, spans 2 columns of the inner grid */}
          <div className="md:col-span-2">
            <OrderIncomeCard />
          </div>
        </div>

        {/* Right 1/3 section: Business Registration Card, spans full height */}
        <div className="lg:col-span-1 lg:row-span-2">
          <BusinessRegistrationCard />
        </div>
      </div>
    </div>
  );
}

ProviderDashboard.Layout = ProviderLayout;
