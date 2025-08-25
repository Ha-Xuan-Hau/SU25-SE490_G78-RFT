"use client";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatisticsChartProps {
  monthlyData?: Array<{
    month: string;
    orderCount: number;
    revenue: number;
  }>;
  year?: number; // Thêm prop year để hiển thị
}

export default function StatisticsChartYear({
  monthlyData,
  year = new Date().getFullYear(), // Default là năm hiện tại
}: StatisticsChartProps) {
  // Map tháng tiếng Anh sang số tháng
  const monthToNumber: Record<string, number> = {
    Jan: 1,
    January: 1,
    Feb: 2,
    February: 2,
    Mar: 3,
    March: 3,
    Apr: 4,
    April: 4,
    May: 5,
    Jun: 6,
    June: 6,
    Jul: 7,
    July: 7,
    Aug: 8,
    August: 8,
    Sep: 9,
    September: 9,
    Oct: 10,
    October: 10,
    Nov: 11,
    November: 11,
    Dec: 12,
    December: 12,
  };

  // Luôn hiển thị 12 tháng
  const months = [
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

  // Khởi tạo arrays cho orders và revenue
  const orders = new Array(12).fill(0);
  const revenue = new Array(12).fill(0);

  // Nếu có data từ API, điền vào đúng vị trí
  if (monthlyData && monthlyData.length > 0) {
    monthlyData.forEach((item) => {
      const monthNum = monthToNumber[item.month];
      if (monthNum && monthNum >= 1 && monthNum <= 12) {
        orders[monthNum - 1] = item.orderCount;
        revenue[monthNum - 1] = Number(item.revenue);
      }
    });
  }

  // Tính tổng để hiển thị summary
  const totalOrders = orders.reduce((a, b) => a + b, 0);
  const totalRevenue = revenue.reduce((a, b) => a + b, 0);

  // Tính max value để set ticks phù hợp
  const maxOrders = Math.max(...orders, 10);
  const maxRevenue = Math.max(...revenue, 1000000);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "11px",
      markers: {
        size: 8,
        offsetX: 0,
        offsetY: 0,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 0,
      },
    },
    colors: ["#3B82F6", "#10B981"],
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
      sparkline: {
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
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
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
        formatter: function (value, { seriesIndex }) {
          if (seriesIndex === 0) {
            return Math.round(value) + " đơn";
          }
          return Math.round(value).toLocaleString("vi-VN") + "₫";
        },
      },
    },
    xaxis: {
      type: "category",
      categories: months,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "10px",
          colors: "#9CA3AF",
        },
      },
    },
    yaxis: [
      {
        // Y-axis cho Số đơn thành công (bên trái)
        min: 0,
        max: Math.ceil(maxOrders / 10) * 10 || 10,
        tickAmount: 3,
        labels: {
          style: {
            fontSize: "10px",
            colors: "#9CA3AF",
          },
          formatter: function (value) {
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
        tickAmount: 3,
        labels: {
          style: {
            fontSize: "10px",
            colors: "#9CA3AF",
          },
          formatter: function (value) {
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
        breakpoint: 1024,
        options: {
          chart: {
            height: 200,
          },
          legend: {
            fontSize: "10px",
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 180,
          },
          legend: {
            show: false,
          },
          xaxis: {
            labels: {
              style: {
                fontSize: "9px",
              },
            },
          },
        },
      },
    ],
  };

  const series = [
    {
      name: "Số đơn thành công",
      data: orders,
      type: "area" as const,
    },
    {
      name: "Doanh số",
      data: revenue,
      type: "area" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Header với summary - UPDATED */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Biểu đồ đơn thành công năm {year}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Theo dõi Đơn thành công và doanh số theo tháng
          </p>
        </div>

        {/* Summary statistics */}
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-gray-500">Tổng đơn thành công:</span>
            <span className="ml-1 font-semibold text-blue-600">
              {totalOrders}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tổng doanh số:</span>
            <span className="ml-1 font-semibold text-green-600">
              {totalRevenue.toLocaleString("vi-VN")}₫
            </span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[200px] sm:h-[220px] lg:h-[240px] xl:h-[260px]">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height="100%"
        />
      </div>

      {/* Legend thủ công cho mobile */}
      <div className="flex items-center justify-center gap-6 mt-3 sm:hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Số đơn thành công
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
