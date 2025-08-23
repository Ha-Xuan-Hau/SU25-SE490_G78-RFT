// pages/provider/dashboard/index.tsx
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UserProfileCard from "./_component/user-profile-card";
import OrderIncomeCard from "./_component/order-income-card";
import BusinessRegistrationCard from "./_component/business-registration-card";
import AnalyticsDashboard from "./_component/analytics-dashboard";
import ProviderLayout from "@/layouts/ProviderLayout";
import { getProviderStatistics } from "@/apis/provider.api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatisticsChartYear from "./_component/statistic-chart-year";
import StatisticsChartMonth from "./_component/statistic-chart-month";

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<"general" | "trends">("general");

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

  const tabs = [
    {
      id: "general" as const,
      label: "Thông tin chung",
    },
    {
      id: "trends" as const,
      label: "Doanh số",
    },
  ];

  const renderGeneralTab = () => (
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
      <div className="flex-1 min-h-[400px] space-y-6">
        <StatisticsChartMonth />
        <StatisticsChartYear monthlyData={statistics?.monthlyRevenue} />
      </div>
    </div>
  );

  const renderTrendsTab = () => <AnalyticsDashboard data={statistics} />;

  return (
    <div className="h-full flex flex-col">
      {/* Header với tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-md transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }
                `}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <span
                  className={`
                  transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                  }
                `}
                ></span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "general" && renderGeneralTab()}
        {activeTab === "trends" && renderTrendsTab()}
      </div>
    </div>
  );
}

ProviderDashboard.Layout = ProviderLayout;
