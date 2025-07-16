import UserProfileCard from "./_component/user-profile-card";
import CarStatsCard from "./_component/car-stats-card";
import OrderIncomeCard from "./_component/order-income-card";
import BusinessRegistrationCard from "./_component/business-registration-card";
import { Car, Key, Gauge, CarFront } from "lucide-react";
import ProviderLayout from "@/layouts/ProviderLayout";
import CarStatsGridCard from "./_component/car-stats-grid-card";
import StatisticsChart from "./_component/statistic-chart";

export default function ProviderDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <UserProfileCard />

        <OrderIncomeCard />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <BusinessRegistrationCard />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>
    </div>
  );
}

ProviderDashboard.Layout = ProviderLayout;
