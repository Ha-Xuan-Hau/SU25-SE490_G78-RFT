"use client";

// filepath: d:\RFT\FE\src\pages\profile\booking-history\index.tsx
import { useState } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { VehicleRentalCard } from "@/components/VehicleRentalCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Tabs } from "antd";

const { TabPane } = Tabs;

// Mock Data cho lịch sử thuê xe
const mockBookingHistory = [
  {
    _id: "booking123",
    carId: {
      _id: "car123",
      model: {
        name: "Toyota Camry",
      },
      yearManufacture: 2022,
      thumb: "/images/demo1.png",
    },
    timeBookingStart: "2023-06-15T00:00:00.000Z",
    timeBookingEnd: "2023-06-20T00:00:00.000Z",
    totalCost: 2500000,
    status: "Đã duyệt",
    contract: {
      status: "Đã tất toán",
    },
  },
  {
    _id: "booking456",
    carId: {
      _id: "car456",
      model: {
        name: "Honda Civic",
      },
      yearManufacture: 2021,
      thumb: "/images/demo1.png",
    },
    timeBookingStart: "2023-05-10T00:00:00.000Z",
    timeBookingEnd: "2023-05-15T00:00:00.000Z",
    totalCost: 2000000,
    status: "Đã duyệt",
    contract: {
      status: "Đã tất toán",
    },
  },
  {
    _id: "booking789",
    carId: {
      _id: "car789",
      model: {
        name: "Mazda CX-5",
      },
      yearManufacture: 2023,
      thumb: "/images/demo1.png",
    },
    timeBookingStart: "2023-07-05T00:00:00.000Z",
    timeBookingEnd: "2023-07-10T00:00:00.000Z",
    totalCost: 3000000,
    status: "Chờ duyệt",
    contract: {
      status: "Đang chờ",
    },
  },
  {
    _id: "booking101",
    carId: {
      _id: "car101",
      model: {
        name: "Ford Ranger",
      },
      yearManufacture: 2020,
      thumb: "/images/demo1.png",
    },
    timeBookingStart: "2023-06-25T00:00:00.000Z",
    timeBookingEnd: "2023-06-30T00:00:00.000Z",
    totalCost: 3500000,
    status: "Đã hủy",
    contract: {
      status: "Đã hủy",
    },
  },
  {
    _id: "booking102",
    carId: {
      _id: "car102",
      model: {
        name: "Mitsubishi Xpander",
      },
      yearManufacture: 2022,
      thumb: "/images/demo1.png",
    },
    timeBookingStart: "2023-08-01T00:00:00.000Z",
    timeBookingEnd: "2023-08-05T00:00:00.000Z",
    totalCost: 1800000,
    status: "Đã duyệt",
    contract: {
      status: "Đang thực hiện",
    },
  },
];

export default function BookingHistoryPage() {
  const [accessToken] = useLocalStorage("access_token", null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Lọc danh sách dựa trên tab đang chọn
  const filteredBookings = mockBookingHistory.filter((booking) => {
    const status = booking.contract?.status || booking.status;

    switch (activeTab) {
      case "waiting":
        return status === "Đang chờ";
      case "active":
        return status === "Đang thực hiện";
      case "completed":
        return status === "Đã tất toán";
      case "canceled":
        return status === "Đã hủy";
      default:
        return true; // Tab "Tất cả"
    }
  });

  // Đếm số lượng cho từng loại
  const waitingCount = mockBookingHistory.filter(
    (b) => (b.contract?.status || b.status) === "Đang chờ"
  ).length;
  const activeCount = mockBookingHistory.filter(
    (b) => (b.contract?.status || b.status) === "Đang thực hiện"
  ).length;
  const completedCount = mockBookingHistory.filter(
    (b) => (b.contract?.status || b.status) === "Đã tất toán"
  ).length;
  const canceledCount = mockBookingHistory.filter(
    (b) => (b.contract?.status || b.status) === "Đã hủy"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header với background trắng và shadow */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Lịch sử thuê xe
              </h1>
              <p className="text-gray-600">
                Quản lý và theo dõi các chuyến đi của bạn
              </p>
            </div>

            {/* Tabs với styling đẹp hơn */}
            <div className="flex-grow flex justify-end">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                className="booking-tabs-enhanced"
                tabBarStyle={{
                  marginBottom: 0,
                  fontSize: "16px",
                  fontWeight: "500",
                }}
                size="large"
              >
                <TabPane
                  tab={
                    <span className="px-4 py-2">
                      Tất cả{" "}
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm ml-1">
                        {mockBookingHistory.length}
                      </span>
                    </span>
                  }
                  key="all"
                />
                <TabPane
                  tab={
                    <span className="px-4 py-2">
                      Đang chờ{" "}
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm ml-1">
                        {waitingCount}
                      </span>
                    </span>
                  }
                  key="waiting"
                />
                <TabPane
                  tab={
                    <span className="px-4 py-2">
                      Đang thuê{" "}
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-sm ml-1">
                        {activeCount}
                      </span>
                    </span>
                  }
                  key="active"
                />
                <TabPane
                  tab={
                    <span className="px-4 py-2">
                      Hoàn thành{" "}
                      <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full text-sm ml-1">
                        {completedCount}
                      </span>
                    </span>
                  }
                  key="completed"
                />
                <TabPane
                  tab={
                    <span className="px-4 py-2">
                      Đã hủy{" "}
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm ml-1">
                        {canceledCount}
                      </span>
                    </span>
                  }
                  key="canceled"
                />
              </Tabs>
            </div>
          </div>
        </div>

        {/* Content area với background trắng */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <div key={index}>
                  <VehicleRentalCard info={booking} accessToken={accessToken} />
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có đơn hàng nào
                </h3>
                <p className="text-gray-500">
                  {activeTab === "all"
                    ? "Bạn chưa có chuyến đi nào. Hãy bắt đầu thuê xe ngay!"
                    : `Không có đơn hàng nào trong trạng thái "${
                        activeTab === "waiting"
                          ? "Đang chờ"
                          : activeTab === "active"
                          ? "Đang thuê"
                          : activeTab === "completed"
                          ? "Hoàn thành"
                          : "Đã hủy"
                      }"`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

BookingHistoryPage.Layout = ProfileLayout;
