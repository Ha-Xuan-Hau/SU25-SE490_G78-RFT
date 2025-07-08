import React, { useState, useEffect } from "react";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { Spin } from "antd";
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
  // Add loading state
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenue, setRevenue] = useState<RevenueByMonth[]>([]);

  // Load data with loading state
  useEffect(() => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      setData(mockDashboardData);
      setRevenue(mockRevenueByMonth);
      setLoading(false);
    }, 800);
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Dashboard content goes here */}
      <div className="text-2xl font-bold mb-6">Dashboard Quản Lý</div>
      <p className="text-gray-500 mb-6">
        Chào mừng đến với hệ thống quản lý của nhà cung cấp. Bạn có thể xem
        thống kê và quản lý xe, đơn đặt, hợp đồng từ menu bên trái.
      </p>
    </div>
  );
}

// Chỉ định layout cho component
ProviderDashboard.Layout = ProviderLayout;
