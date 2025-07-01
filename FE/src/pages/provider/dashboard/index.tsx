import React from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { formatCurrency } from "@/lib/format-currency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Đăng ký các thành phần cần thiết cho ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// Tạo kiểu dữ liệu cho dashboard
interface DashboardData {
  totalBookingByMonth: number;
  totalCars: number;
  totalUsers: number;
  totalRevenue: number;
}

// Tạo kiểu dữ liệu cho doanh thu theo tháng
interface RevenueByMonth {
  month: string;
  totalRevenue: number;
}

// Mock data cho dashboard
const mockDashboardData: DashboardData = {
  totalBookingByMonth: 142,
  totalCars: 37,
  totalUsers: 218,
  totalRevenue: 45000000,
};

// Mock data cho doanh thu theo tháng
const mockRevenueByMonth: RevenueByMonth[] = [
  { month: "1", totalRevenue: 3500000 },
  { month: "2", totalRevenue: 4200000 },
  { month: "3", totalRevenue: 3800000 },
  { month: "4", totalRevenue: 5100000 },
  { month: "5", totalRevenue: 4800000 },
  { month: "6", totalRevenue: 6200000 },
  { month: "7", totalRevenue: 5500000 },
  { month: "8", totalRevenue: 7000000 },
  { month: "9", totalRevenue: 6500000 },
  { month: "10", totalRevenue: 5800000 },
  { month: "11", totalRevenue: 6800000 },
  { month: "12", totalRevenue: 7500000 },
];

// Cấu hình biểu đồ
const options = {
  bezierCurve: true,
  tension: 0.4,
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "Thống kê doanh thu",
    },
  },
};

// Component Dashboard
export default function ProviderDashboard() {
  // Sử dụng mock data
  const data = mockDashboardData;
  const revenue = mockRevenueByMonth;

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = {
    labels: Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`),
    datasets: [
      {
        data: Array.from({ length: 12 }, (_, i) => {
          const found = revenue.find((item) => Number(item.month) === i + 1);
          return found?.totalRevenue ?? 0;
        }),
        fill: true,
        borderColor: "rgb(142, 228, 157)",
        label: "Doanh thu",
      },
    ],
  };

  return (
    <div>
      {/* <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="shadow-lg rounded-md p-6 flex flex-col justify-center items-center bg-white">
          <div className="text-3xl font-bold mb-1">
            {data.totalBookingByMonth}
          </div>
          <span>lượt thuê xe</span>
        </div>
        <div className="shadow-lg rounded-md p-6 flex flex-col justify-center items-center bg-white">
          <div className="text-3xl font-bold mb-1">{data.totalCars}</div>
          <span>xe</span>
        </div>
        <div className="shadow-lg rounded-md p-6 flex flex-col justify-center items-center bg-white">
          <div className="text-3xl font-bold mb-1">{data.totalUsers}</div>
          <span>người dùng</span>
        </div>
        <div className="shadow-lg rounded-md p-6 flex flex-col justify-center items-center bg-white">
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(data.totalRevenue)}
          </div>
          <span>doanh thu</span>
        </div>
      </div>

      <div className="h-96 mt-10 flex justify-center">
        <Line options={options} data={chartData} />
      </div> */}
    </div>
  );
}

// Chỉ định layout cho component
ProviderDashboard.Layout = ProviderLayout;
