// pages/provider/dashboard/index.tsx
import { useQuery } from "@tanstack/react-query";
import UserProfileCard from "./_component/user-profile-card";
import OrderIncomeCard from "./_component/order-income-card";
import BusinessRegistrationCard from "./_component/business-registration-card";
import ProviderLayout from "@/layouts/ProviderLayout";
import StatisticsChart from "./_component/statistic-chart";
import { getProviderStatistics } from "@/apis/provider.api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProviderDashboard() {
  const {
    data: statistics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["provider-statistics"],
    queryFn: getProviderStatistics,
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8 text-red-500">
          Không thể tải dữ liệu thống kê
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6">
      {/* Top section - Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
        <div className="xl:col-span-7 space-y-4 lg:space-y-6">
          <UserProfileCard statistics={statistics} />
          <OrderIncomeCard statistics={statistics} />
        </div>
        <div className="xl:col-span-5">
          <BusinessRegistrationCard statistics={statistics} />
        </div>
      </div>

      {/* Bottom section - Chart */}
      <div className="flex-1 min-h-[400px]">
        <StatisticsChart monthlyData={statistics?.monthlyRevenue} />
      </div>
    </div>
  );
}

ProviderDashboard.Layout = ProviderLayout;
