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
    //refetchInterval: 60000, // Refresh mỗi phút
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Không thể tải dữ liệu thống kê
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <UserProfileCard statistics={statistics} />
        <OrderIncomeCard statistics={statistics} />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <BusinessRegistrationCard statistics={statistics} />
      </div>
      <div className="col-span-12">
        <StatisticsChart monthlyData={statistics?.monthlyRevenue} />
      </div>
    </div>
  );
}

ProviderDashboard.Layout = ProviderLayout;
