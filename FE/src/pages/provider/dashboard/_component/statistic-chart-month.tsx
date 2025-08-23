"use client";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface StatisticsChartProps {
  dailyData?: Array<{
    day: string | number;
    orderCount: number;
    revenue: number;
  }>;
}

export default function StatisticsChartMonth({
  dailyData,
}: StatisticsChartProps) {
  // Lấy tháng hiện tại
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();

  // Tính số ngày trong tháng hiện tại
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Tạo array các ngày trong tháng (1, 2, 3, ..., 30/31)
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    (i + 1).toString()
  );

  // Khởi tạo arrays cho orders và revenue
  const orders = new Array(daysInMonth).fill(0);
  const revenue = new Array(daysInMonth).fill(0);

  // Nếu có data từ API, điền vào đúng vị trí
  if (dailyData && dailyData.length > 0) {
    dailyData.forEach((item) => {
      const dayNum =
        typeof item.day === "string" ? parseInt(item.day) : item.day;
      if (dayNum && dayNum >= 1 && dayNum <= daysInMonth) {
        orders[dayNum - 1] = item.orderCount;
        revenue[dayNum - 1] = Number(item.revenue);
      }
    });
  }

  // Tính max value để set ticks phù hợp
  const maxOrders = Math.max(...orders, 10);
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
          fontSize: "9px",
          colors: "#9CA3AF",
        },
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        maxHeight: 60,
        trim: false,
        formatter: function (value: string): string {
          return value;
        },
      },
    },
    yaxis: [
      {
        // Y-axis cho số đơn (bên trái)
        min: 0,
        max: Math.ceil(maxOrders / 10) * 10 || 10,
        tickAmount: 3,
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
          text: undefined,
        },
      },
      {
        // Y-axis cho doanh thu (bên phải)
        opposite: true,
        min: 0,
        max: Math.ceil(maxRevenue / 1000000) * 1000000 || 1000000,
        tickAmount: 3,
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
          text: undefined,
        },
      },
    ],
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 220,
          },
          legend: {
            fontSize: "10px",
          },
          xaxis: {
            labels: {
              style: {
                fontSize: "8px",
              },
              rotate: -45,
            },
          },
        },
      },
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 200,
          },
          legend: {
            show: false,
          },
          xaxis: {
            labels: {
              style: {
                fontSize: "7px",
              },
              rotate: -45,
              formatter: function (value: string): string {
                const day = parseInt(value);
                // Hiển thị ngày 1, 5, 10, 15, 20, 25, 30 và ngày cuối tháng
                if (
                  day === 1 ||
                  day === 5 ||
                  day === 10 ||
                  day === 15 ||
                  day === 20 ||
                  day === 25 ||
                  day === 30 ||
                  day === daysInMonth
                ) {
                  return value;
                }
                return "";
              },
            },
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
                fontSize: "6px",
              },
              rotate: -45,
              formatter: function (value: string): string {
                const day = parseInt(value);
                // Mobile: chỉ hiển thị ngày 1, 5, 10, 15, 20, 25, 30 và ngày cuối tháng
                if (
                  day === 1 ||
                  day === 5 ||
                  day === 10 ||
                  day === 15 ||
                  day === 20 ||
                  day === 25 ||
                  day === 30 ||
                  day === daysInMonth
                ) {
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

  // Tính tổng để hiển thị summary
  const totalOrders = orders.reduce((a, b) => a + b, 0);
  const totalRevenue = revenue.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Header với summary */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Biểu đồ thống kê {monthNames[currentMonth]} {currentYear}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Theo dõi xu hướng theo ngày trong tháng
          </p>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[240px] sm:h-[260px] lg:h-[280px] xl:h-[300px]">
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
            Số đơn
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Doanh thu
          </span>
        </div>
      </div>
    </div>
  );
}
