"use client";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MetricConfig {
  id: string;
  label: string;
  color: string;
  formatter?: (value: number) => string;
  yAxisSide?: "left" | "right";
}

interface DataPoint {
  timestamp: Date;
  [metricId: string]: number | Date;
}

interface DynamicStatisticsChartProps {
  startDate: string;
  endDate: string;
  selectedMetrics: string[];
  data?: DataPoint[];
}

// Metric configurations
const METRIC_CONFIGS: Record<string, MetricConfig> = {
  customers: {
    id: "customers",
    label: "Khách hàng",
    color: "#3B82F6",
    formatter: (value) => `${Math.round(value)} khách`,
    yAxisSide: "left",
  },
  bookings: {
    id: "bookings",
    label: "Đơn đặt xe",
    color: "#8B5CF6",
    formatter: (value) => `${Math.round(value)} đơn`,
    yAxisSide: "left",
  },
  revenue: {
    id: "revenue",
    label: "Doanh số",
    color: "#10B981",
    formatter: (value) => `${Math.round(value).toLocaleString("vi-VN")}₫`,
    yAxisSide: "right",
  },
  successCustomers: {
    id: "successCustomers",
    label: "Khách hàng (thành công)",
    color: "#F59E0B",
    formatter: (value) => `${Math.round(value)} khách`,
    yAxisSide: "left",
  },
  successBooking: {
    id: "successBooking",
    label: "Đơn thành công",
    color: "#EF4444",
    formatter: (value) => `${Math.round(value)} đơn`,
    yAxisSide: "left",
  },
  successRevenue: {
    id: "successRevenue",
    label: "Doanh số (thành công)",
    color: "#06B6D4",
    formatter: (value) => `${Math.round(value).toLocaleString("vi-VN")}₫`,
    yAxisSide: "right",
  },
  avgRevenue: {
    id: "avgRevenue",
    label: "TB/Khách hàng",
    color: "#EC4899",
    formatter: (value) => `${Math.round(value).toLocaleString("vi-VN")}₫`,
    yAxisSide: "right",
  },
  conversionRate: {
    id: "conversionRate",
    label: "Tỉ lệ chuyển đổi",
    color: "#84CC16",
    formatter: (value) => `${value.toFixed(1)}%`,
    yAxisSide: "right",
  },
};

// Utility functions
const getDaysBetween = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getTimeFrame = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = getDaysBetween(start, end);

  if (daysDiff <= 7) {
    return "hourly";
  } else if (daysDiff <= 31) {
    return "daily";
  } else if (daysDiff <= 60) {
    return "weekly"; // Thêm weekly cho 1-2 tháng
  } else {
    return "monthly";
  }
};

const generateMockData = (
  startDate: string,
  endDate: string,
  selectedMetrics: string[],
  timeFrame: "hourly" | "daily" | "weekly" | "monthly"
): DataPoint[] => {
  const data: DataPoint[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (timeFrame === "hourly") {
    // Generate hourly data for each day
    const currentDate = new Date(start);
    while (currentDate <= end) {
      for (let hour = 0; hour < 24; hour += 8) {
        const point: DataPoint = {
          timestamp: new Date(currentDate.setHours(hour)),
        };
        selectedMetrics.forEach((metricId) => {
          if (metricId.includes("revenue")) {
            point[metricId] = Math.random() * 5000000 + 1000000;
          } else if (metricId === "conversionRate") {
            point[metricId] = Math.random() * 30 + 70;
          } else {
            point[metricId] = Math.floor(Math.random() * 50 + 10);
          }
        });
        data.push(point);
      }
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0);
    }
  } else if (timeFrame === "daily") {
    // Generate daily data
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const point: DataPoint = {
        timestamp: new Date(currentDate),
      };
      selectedMetrics.forEach((metricId) => {
        if (metricId.includes("revenue")) {
          point[metricId] = Math.random() * 10000000 + 2000000;
        } else if (metricId === "conversionRate") {
          point[metricId] = Math.random() * 20 + 75;
        } else {
          point[metricId] = Math.floor(Math.random() * 100 + 20);
        }
      });
      data.push(point);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (timeFrame === "weekly") {
    // Generate weekly data (mỗi tuần)
    const currentDate = new Date(start);
    // Điều chỉnh về thứ 2 đầu tuần
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    currentDate.setDate(currentDate.getDate() + daysToMonday);

    while (currentDate <= end) {
      const point: DataPoint = {
        timestamp: new Date(currentDate),
      };
      selectedMetrics.forEach((metricId) => {
        if (metricId.includes("revenue")) {
          point[metricId] = Math.random() * 70000000 + 14000000; // Tổng tuần
        } else if (metricId === "conversionRate") {
          point[metricId] = Math.random() * 20 + 75;
        } else {
          point[metricId] = Math.floor(Math.random() * 700 + 140); // Tổng tuần
        }
      });
      data.push(point);
      currentDate.setDate(currentDate.getDate() + 7); // Nhảy sang tuần tiếp theo
    }
  } else {
    // Generate monthly data
    const currentDate = new Date(start);
    currentDate.setDate(1);
    while (currentDate <= end) {
      const point: DataPoint = {
        timestamp: new Date(currentDate),
      };
      selectedMetrics.forEach((metricId) => {
        if (metricId.includes("revenue")) {
          point[metricId] = Math.random() * 300000000 + 50000000;
        } else if (metricId === "conversionRate") {
          point[metricId] = Math.random() * 15 + 80;
        } else {
          point[metricId] = Math.floor(Math.random() * 3000 + 500);
        }
      });
      data.push(point);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return data;
};

const formatXAxisLabel = (
  timestamp: Date,
  timeFrame: "hourly" | "daily" | "weekly" | "monthly"
): string => {
  if (timeFrame === "hourly") {
    const hour = timestamp.getHours();
    const day = timestamp.getDate();
    const month = timestamp.getMonth() + 1;
    // Format rõ ràng hơn
    return `${day}/${month} - ${hour}:00`;
  } else if (timeFrame === "daily") {
    const day = timestamp.getDate();
    const month = timestamp.getMonth() + 1;
    // Hiển thị cả tháng để rõ ràng hơn
    return `${day}/${month}`;
  } else if (timeFrame === "weekly") {
    const day = timestamp.getDate();
    const month = timestamp.getMonth() + 1;
    const weekOfMonth = Math.ceil(day / 7);
    // Format ngắn gọn hơn
    return `T${weekOfMonth} (${day}/${month})`;
  } else {
    const monthNames = [
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
    const year = timestamp.getFullYear();
    // Thêm năm nếu cần
    return `${monthNames[timestamp.getMonth()]}/${year}`;
  }
};

export default function DynamicStatisticsChart({
  startDate,
  endDate,
  selectedMetrics,
  data,
}: DynamicStatisticsChartProps) {
  const timeFrame = getTimeFrame(startDate, endDate);

  // Generate or use provided data
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    return generateMockData(startDate, endDate, selectedMetrics, timeFrame);
  }, [startDate, endDate, selectedMetrics, timeFrame, data]);

  // Prepare categories and series
  const categories = chartData.map((point) =>
    formatXAxisLabel(point.timestamp, timeFrame)
  );

  const series = selectedMetrics.map((metricId) => {
    const config = METRIC_CONFIGS[metricId];
    return {
      name: config?.label || metricId,
      data: chartData.map((point) => (point[metricId] as number) || 0),
      type: "line" as const,
    };
  });

  // Generate colors for selected metrics
  const colors = selectedMetrics.map(
    (metricId) => METRIC_CONFIGS[metricId]?.color || "#6B7280"
  );

  // Configure Y-axes based on selected metrics
  const yAxisConfigs = useMemo(() => {
    const leftMetrics = selectedMetrics.filter(
      (id) => METRIC_CONFIGS[id]?.yAxisSide !== "right"
    );
    const rightMetrics = selectedMetrics.filter(
      (id) => METRIC_CONFIGS[id]?.yAxisSide === "right"
    );

    const axes: any[] = [];

    // Left axis (if there are left metrics)
    if (leftMetrics.length > 0) {
      axes.push({
        seriesName: METRIC_CONFIGS[leftMetrics[0]]?.label,
        min: 0,
        tickAmount: 4,
        labels: {
          style: {
            fontSize: "10px",
            colors: "#9CA3AF",
          },
          formatter: (value: number) => {
            if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return Math.round(value).toString();
          },
        },
        title: {
          text:
            leftMetrics.length === 1
              ? METRIC_CONFIGS[leftMetrics[0]]?.label
              : undefined,
          style: {
            fontSize: "11px",
            color: "#6B7280",
          },
        },
      });

      // Add additional left axes if needed
      leftMetrics.slice(1).forEach((metricId) => {
        axes.push({
          seriesName: METRIC_CONFIGS[metricId]?.label,
          show: false,
        });
      });
    }

    // Right axis (if there are right metrics)
    if (rightMetrics.length > 0) {
      axes.push({
        seriesName: METRIC_CONFIGS[rightMetrics[0]]?.label,
        opposite: true,
        min: 0,
        tickAmount: 4,
        labels: {
          style: {
            fontSize: "10px",
            colors: "#9CA3AF",
          },
          formatter: (value: number) => {
            const metricId = rightMetrics[0];
            if (metricId === "conversionRate") {
              return `${value.toFixed(0)}%`;
            }
            if (value >= 1000000000) {
              return `${(value / 1000000000).toFixed(0)}B`;
            } else if (value >= 1000000) {
              return `${(value / 1000000).toFixed(0)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}K`;
            }
            return Math.round(value).toString();
          },
        },
        title: {
          text:
            rightMetrics.length === 1
              ? METRIC_CONFIGS[rightMetrics[0]]?.label
              : undefined,
          style: {
            fontSize: "11px",
            color: "#6B7280",
          },
        },
      });

      // Add additional right axes if needed
      rightMetrics.slice(1).forEach((metricId) => {
        axes.push({
          seriesName: METRIC_CONFIGS[metricId]?.label,
          opposite: true,
          show: false,
        });
      });
    }

    return axes;
  }, [selectedMetrics]);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
      markers: {
        size: 8,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 4,
      },
    },
    colors,
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
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
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
          const metricId = selectedMetrics[seriesIndex];
          const config = METRIC_CONFIGS[metricId];
          return config?.formatter ? config.formatter(value) : value.toString();
        },
      },
    },
    // Cập nhật phần xaxis trong options để xử lý weekly
    xaxis: {
      type: "category",
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: true,
        style: {
          fontSize: "12px",
          colors: "#374151",
          fontWeight: 500,
        },
        rotate:
          timeFrame === "hourly" ||
          timeFrame === "weekly" ||
          timeFrame === "daily"
            ? -45
            : 0, // Xoay cho daily nếu nhiều ngày
        formatter: function (value: string): string {
          // Với daily, LUÔN hiển thị TẤT CẢ các ngày
          if (timeFrame === "daily") {
            return value; // Hiển thị tất cả, không ẩn gì
          }
          return value;
        },
      },
    },
    yaxis: yAxisConfigs,
    responsive: [
      {
        breakpoint: 1536, // 2xl
        options: {
          chart: {
            height: 650,
          },
          xaxis: {
            labels: {
              style: {
                fontSize: "12px",
                fontWeight: 500,
              },
              rotate: timeFrame === "daily" && categories.length > 20 ? -45 : 0,
            },
          },
        },
      },
      {
        breakpoint: 1280, // xl
        options: {
          chart: {
            height: 600,
          },
          xaxis: {
            labels: {
              style: {
                fontSize: "11px",
                fontWeight: 500,
              },
              rotate: timeFrame === "daily" && categories.length > 15 ? -45 : 0,
            },
          },
        },
      },
      {
        breakpoint: 1024, // lg
        options: {
          chart: {
            height: 550,
          },
          legend: {
            position: "bottom",
            horizontalAlign: "center",
          },
          xaxis: {
            labels: {
              style: {
                fontSize: "10px",
                fontWeight: 500,
              },
              rotate: timeFrame === "daily" ? -45 : 0, // Luôn xoay cho daily trên tablet
            },
          },
        },
      },
      {
        breakpoint: 768, // md
        options: {
          chart: {
            height: 500,
          },
          legend: {
            show: false,
          },
          xaxis: {
            labels: {
              rotate: -45, // Luôn xoay trên mobile
              style: {
                fontSize: "9px",
                fontWeight: 500,
              },
            },
          },
        },
      },
      {
        breakpoint: 640, // sm
        options: {
          chart: {
            height: 450,
          },
          legend: {
            show: false,
          },
          xaxis: {
            labels: {
              rotate: -45, // Luôn xoay trên mobile
              style: {
                fontSize: "8px",
                fontWeight: 500,
              },
            },
          },
        },
      },
    ],
  };

  // Get time frame label for display
  const getTimeFrameLabel = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (timeFrame === "hourly") {
      return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
        "vi-VN"
      )} (Theo giờ)`;
    } else if (timeFrame === "daily") {
      const month = start.getMonth() + 1;
      const year = start.getFullYear();
      return `Tháng ${month}/${year} (Theo ngày)`;
    } else if (timeFrame === "weekly") {
      return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
        "vi-VN"
      )} (Theo tuần)`;
    } else {
      return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
        "vi-VN"
      )} (Theo tháng)`;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Biểu đồ xu hướng
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getTimeFrameLabel()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedMetrics.map((metricId) => (
            <span
              key={metricId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${METRIC_CONFIGS[metricId]?.color}20`,
                color: METRIC_CONFIGS[metricId]?.color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: METRIC_CONFIGS[metricId]?.color }}
              />
              {METRIC_CONFIGS[metricId]?.label || metricId}
            </span>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[350px] sm:h-[400px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px]">
        {selectedMetrics.length > 0 ? (
          <ReactApexChart
            options={options}
            series={series}
            type="line"
            height="100%"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="mt-2 text-sm">
                Vui lòng chọn ít nhất một chỉ số để hiển thị
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend for mobile */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 sm:hidden">
        {selectedMetrics.map((metricId) => (
          <div key={metricId} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: METRIC_CONFIGS[metricId]?.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {METRIC_CONFIGS[metricId]?.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
