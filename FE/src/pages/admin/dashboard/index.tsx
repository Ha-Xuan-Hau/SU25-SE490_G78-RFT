import { AdminLayout } from "@/layouts/AdminLayout";
import UserProfileCard from "@/pages/provider/dashboard/_component/user-profile-card";
import OrderIncomeCard from "@/pages/provider/dashboard/_component/order-income-card";
import BusinessRegistrationCard from "@/pages/provider/dashboard/_component/business-registration-card";
import StatisticsChart from "@/pages/provider/dashboard/_component/statistic-chart";

export default function AdminDashboard() {
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

AdminDashboard.Layout = AdminLayout;
