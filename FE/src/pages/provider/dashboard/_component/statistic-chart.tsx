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
}

export default function StatisticsChart({ monthlyData }: StatisticsChartProps) {
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
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
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

  // Tính max value để set ticks phù hợp
  const maxOrders = Math.max(...orders, 10);
  const maxRevenue = Math.max(...revenue, 1000000);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 250,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
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
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
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
          fontSize: "12px",
          colors: "#6B7280",
        },
      },
    },
    yaxis: [
      {
        // Y-axis cho số đơn (bên trái)
        min: 0,
        max: Math.ceil(maxOrders / 10) * 10,
        tickAmount: 5,
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: function (value) {
            return Math.round(value).toString();
          },
        },
        forceNiceScale: true,
      },
      {
        // Y-axis cho doanh thu (bên phải)
        opposite: true,
        min: 0,
        max: Math.ceil(maxRevenue / 1000000) * 1000000,
        tickAmount: 5,
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: function (value) {
            if (value >= 1000000000) {
              return Math.round(value / 1000000000) + "B";
            } else if (value >= 1000000) {
              return Math.round(value / 1000000) + "M";
            } else if (value >= 1000) {
              return Math.round(value / 1000) + "K";
            }
            return Math.round(value).toString();
          },
        },
        forceNiceScale: true,
      },
    ],
  };

  const series = [
    {
      name: "Số đơn",
      data: orders,
      type: "area" as const,
    },
    {
      name: "Doanh thu",
      data: revenue,
      type: "area" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Thống kê doanh thu
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Số đơn hàng và doanh thu theo tháng
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={190}
          />
        </div>
      </div>
    </div>
  );
}
