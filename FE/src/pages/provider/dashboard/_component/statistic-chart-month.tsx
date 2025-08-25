"use client";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getMetricData } from "@/apis/provider.api";
import { Spin } from "antd";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DataPoint {
  timestamp: string;
  value: number;
}

interface StatisticsChartProps {
  month?: number; // Tháng cần hiển thị (1-12)
  year?: number; // Năm cần hiển thị
}

export default function StatisticsChartMonth({
  month,
  year,
}: StatisticsChartProps) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<{
    customers: DataPoint[];
    revenue: DataPoint[];
  }>({
    customers: [],
    revenue: [],
  });

  // Lấy tháng/năm hiện tại nếu không được truyền vào
  const currentDate = new Date();
  const displayMonth = month || currentDate.getMonth() + 1; // 1-12
  const displayYear = year || currentDate.getFullYear();

  // Tính số ngày trong tháng
  const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();

  useEffect(() => {
    fetchMonthlyData();
  }, [displayMonth, displayYear]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);

      // Tạo startDate và endDate cho tháng được chọn
      const startDate = `${displayYear}-${String(displayMonth).padStart(
        2,
        "0"
      )}-01`;
      const endDate = `${displayYear}-${String(displayMonth).padStart(
        2,
        "0"
      )}-${String(daysInMonth).padStart(2, "0")}`;

      // Gọi API song song cho 2 metrics
      const [customersResponse, revenueResponse] = await Promise.all([
        getMetricData({
          startDate,
          endDate,
          metric: "successBookings",
          groupBy: "day",
        }),
        getMetricData({
          startDate,
          endDate,
          metric: "successRevenue",
          groupBy: "day",
        }),
      ]);

      setChartData({
        customers: customersResponse.data || [],
        revenue: revenueResponse.data || [],
      });
    } catch (error) {
      console.error("Error fetching monthly chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tạo array các ngày trong tháng
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    (i + 1).toString()
  );

  // Khởi tạo arrays cho customers và revenue
  const customers = new Array(daysInMonth).fill(0);
  const revenue = new Array(daysInMonth).fill(0);

  // Map data từ API vào arrays
  if (chartData.customers.length > 0) {
    chartData.customers.forEach((item) => {
      const date = new Date(item.timestamp);
      const day = date.getUTCDate(); // Dùng UTC để tránh timezone issues
      if (day >= 1 && day <= daysInMonth) {
        customers[day - 1] = item.value;
      }
    });
  }

  if (chartData.revenue.length > 0) {
    chartData.revenue.forEach((item) => {
      const date = new Date(item.timestamp);
      const day = date.getUTCDate();
      if (day >= 1 && day <= daysInMonth) {
        revenue[day - 1] = item.value;
      }
    });
  }

  // Tính max value để set ticks phù hợp
  const maxCustomers = Math.max(...customers, 10);
  const maxRevenue = Math.max(...revenue, 1000000);

  // Tên tháng để hiển thị
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "11px",
      markers: {
        size: 8,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 0,
      },
    },
    colors: ["#F59E0B", "#10B981"], // Màu cho customers và revenue
    chart: {
      fontFamily: "Inter, sans-serif",
      height: "100%",
      type: "line",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 4,
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: "light",
      style: {
        fontSize: "11px",
      },
      y: {
        formatter: function (
          value: number,
          { seriesIndex }: { seriesIndex: number }
        ) {
          if (seriesIndex === 0) {
            return Math.round(value) + " đơn";
          }
          return Math.round(value).toLocaleString("vi-VN") + "₫";
        },
      },
    },
    xaxis: {
      type: "category",
      categories: days,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: true,
        style: {
          fontSize: "9px", // Giảm font size để fit nhiều label hơn
          colors: "#9CA3AF",
        },
        rotate: -45, // Xoay để tránh chồng chéo
        // Bỏ formatter hoặc return tất cả
        formatter: function (value: string): string {
          return value; // Hiển thị tất cả các ngày
        },
      },
    },

    yaxis: [
      {
        // Y-axis cho số Đơn thành công (bên trái)
        min: 0,
        max: Math.ceil(maxCustomers / 10) * 10 || 10,
        tickAmount: 4,
        labels: {
          style: {
            fontSize: "10px",
            colors: "#9CA3AF",
          },
          formatter: function (value: number): string {
            return Math.round(value).toString();
          },
        },
        title: {
          text: "Đơn thành công",
          style: {
            fontSize: "11px",
            color: "#6B7280",
          },
        },
      },
      {
        // Y-axis cho Doanh số (bên phải)
        opposite: true,
        min: 0,
        max: Math.ceil(maxRevenue / 1000000) * 1000000 || 1000000,
        tickAmount: 4,
        labels: {
          style: {
            fontSize: "10px",
            colors: "#9CA3AF",
          },
          formatter: function (value: number): string {
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(0) + "B";
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(0) + "M";
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + "K";
            }
            return Math.round(value).toString();
          },
        },
        title: {
          text: "Doanh số",
          style: {
            fontSize: "11px",
            color: "#6B7280",
          },
        },
      },
    ],
    responsive: [
      {
        breakpoint: 1024, // Tablet
        options: {
          chart: {
            height: 220,
          },
          xaxis: {
            labels: {
              rotate: -45,
              style: {
                fontSize: "8px", // Nhỏ hơn cho tablet
              },
              formatter: function (value: string): string {
                const day = parseInt(value);
                // Hiển thị mỗi 2 ngày trên tablet
                if (day % 2 === 1) {
                  return value;
                }
                return "";
              },
            },
          },
        },
      },
      {
        breakpoint: 768, // Mobile
        options: {
          chart: {
            height: 200,
          },
          legend: {
            show: false,
          },
          xaxis: {
            labels: {
              rotate: -45,
              style: {
                fontSize: "7px", // Rất nhỏ cho mobile
              },
              formatter: function (value: string): string {
                const day = parseInt(value);
                // Hiển thị mỗi 5 ngày trên mobile
                if (day % 5 === 0 || day === 1 || day === daysInMonth) {
                  return value;
                }
                return "";
              },
            },
          },
        },
      },
    ],
  };

  const series = [
    {
      name: "Đơn thành công",
      data: customers,
      type: "area" as const,
    },
    {
      name: "Doanh số",
      data: revenue,
      type: "area" as const,
    },
  ];

  // Tính tổng để hiển thị summary
  const totalCustomers = customers.reduce((a, b) => a + b, 0);
  const totalRevenue = revenue.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Header với summary */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Biểu đồ đơn thành công {monthNames[displayMonth - 1]} {displayYear}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Theo dõi Đơn thành công và doanh số theo ngày
          </p>
        </div>
        {!loading && (
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-gray-500">Tổng đơn thành công:</span>
              <span className="ml-1 font-semibold text-orange-600">
                {totalCustomers}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Tổng Doanh số:</span>
              <span className="ml-1 font-semibold text-green-600">
                {totalRevenue.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart container */}
      <div className="h-[240px] sm:h-[260px] lg:h-[280px] xl:h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
            <Spin tip="Đang tải dữ liệu..." />
          </div>
        ) : (
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height="100%"
          />
        )}
      </div>

      {/* Legend thủ công cho mobile */}
      <div className="flex items-center justify-center gap-6 mt-3 sm:hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Đơn thành công
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Doanh số
          </span>
        </div>
      </div>
    </div>
  );
}
