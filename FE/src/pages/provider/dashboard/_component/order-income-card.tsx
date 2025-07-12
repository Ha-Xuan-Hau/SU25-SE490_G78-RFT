"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Settings } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrderIncomeCard() {
  const data = {
    labels: ["Đơn chưa xử lý", "Đơn đang chạy", "Đơn đã hủy"],
    datasets: [
      {
        data: [15, 40, 5], // Ví dụ: 15 đơn chưa xử lý, 40 đơn đang chạy, 5 đơn đã hủy
        backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"], // Vàng, Xanh, Đỏ
        hoverBackgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "80%", // Makes it a donut chart
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Thống kê Đơn hàng & Thu nhập
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span className="text-gray-700 font-medium">50.000.000 VNĐ</span>
              <span className="text-gray-500 text-sm ml-2">
                Thu nhập trong tháng
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              <span className="text-gray-700 font-medium">120</span>
              <span className="text-gray-500 text-sm ml-2">
                Tổng đơn thành công
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
              <span className="text-gray-700 font-medium">15</span>
              <span className="text-gray-500 text-sm ml-2">Đơn đã hủy</span>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <span className="text-green-500 font-semibold">8.5%</span> Tăng so
              với tháng trước
            </p>
          </div>
          <div className="relative flex items-center justify-center h-40 w-40 mx-auto">
            <Doughnut data={data} options={options} />
            <div className="absolute text-center">
              <div className="text-2xl font-bold text-gray-800">60</div>
              <div className="text-sm text-gray-500">Tổng đơn</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
