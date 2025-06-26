// filepath: d:\RFT\FE\src\pages\profile\booking-history\index.tsx
import React, { useState } from "react";
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
    <div>
      <div className="mb-8">
        {/* Header với Tabs nằm bên phải */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lịch sử thuê xe</h1>

          <div className="flex-grow flex justify-end">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              className="booking-tabs"
              tabBarStyle={{ marginBottom: 0 }}
              size="small"
            >
              <TabPane
                tab={`Tất cả (${mockBookingHistory.length})`}
                key="all"
              />
              <TabPane tab={`Đang chờ (${waitingCount})`} key="waiting" />
              <TabPane tab={`Đang thuê (${activeCount})`} key="active" />
              <TabPane tab={`Hoàn thành (${completedCount})`} key="completed" />
              <TabPane tab={`Đã hủy (${canceledCount})`} key="canceled" />
            </Tabs>
          </div>
        </div>

        {/* Danh sách các đơn hàng */}
        <div className="flex flex-col gap-5 overflow-y-auto max-h-[700px]">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking, index) => (
              <VehicleRentalCard
                key={index}
                info={booking}
                accessToken={accessToken}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              Không có đơn hàng nào trong trạng thái này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Set layout cho trang
BookingHistoryPage.Layout = ProfileLayout;
