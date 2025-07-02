"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { VehicleRentalCard } from "@/components/VehicleRentalCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Tabs, Empty, Spin } from "antd";

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
      status: "Chờ xử lý",
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
  {
    _id: "booking103",
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
  {
    _id: "booking104",
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
  {
    _id: "booking105",
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
  const [visibleCount, setVisibleCount] = useState<number>(5); // Số đơn hàng hiển thị ban đầu
  const [loading, setLoading] = useState<boolean>(false); // Trạng thái đang tải thêm
  const loaderRef = useRef<HTMLDivElement>(null); // Ref cho phần tử ở cuối danh sách

  // Lọc danh sách dựa trên tab đang chọn
  const filteredBookings = mockBookingHistory.filter((booking) => {
    const status = booking.contract?.status || booking.status;

    switch (activeTab) {
      case "processing":
        return status === "Chờ xử lý";
      case "transporting":
        return status === "Đang giao xe";
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

  const visibleBookings = filteredBookings.slice(0, visibleCount);

  const hasMore = visibleCount < filteredBookings.length;

  // Đếm số lượng cho từng loại
  const waitingCount = mockBookingHistory.filter(
    (b) => (b.contract?.status || b.status) === "Chờ xử lý"
  ).length;
  const transportingCount = mockBookingHistory.filter(
    (b) => (b.contract?.status || b.status) === "Đang giao xe"
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

  // Hàm load thêm đơn hàng
  const loadMoreBookings = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Giả lập việc tải dữ liệu (có thể thay bằng API call thực tế)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5); // Load thêm 5 đơn hàng mỗi lần
      setLoading(false);
    }, 800);
  }, [loading, hasMore]);

  // Xử lý tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setVisibleCount(5); // Reset số đơn hàng hiển thị khi chuyển tab
  }, []);

  // Thiết lập Intersection Observer để phát hiện khi người dùng cuộn đến cuối danh sách
  useEffect(() => {
    // Nếu không có loader ref hoặc không còn đơn hàng để load, không cần theo dõi scroll
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMoreBookings();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [activeTab, visibleCount, loading, hasMore, loadMoreBookings]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tab container */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="w-full">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type="card"
            className="w-full"
            tabBarStyle={{
              marginBottom: 0,
              fontSize: "16px",
              fontWeight: "500",
              display: "flex",
              width: "100%",
            }}
            size="large"
            tabBarGutter={0}
          >
            <TabPane
              tab={
                <div
                  style={{ width: "100%", textAlign: "center" }}
                  className="px-4 py-2"
                >
                  Tất cả{" "}
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm ml-1">
                    {mockBookingHistory.length}
                  </span>
                </div>
              }
              key="all"
            />
            <TabPane
              tab={
                <div
                  style={{ width: "100%", textAlign: "center" }}
                  className="px-4 py-2"
                >
                  Chờ xử lý{" "}
                  <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm ml-1">
                    {waitingCount}
                  </span>
                </div>
              }
              key="processing"
            />
            <TabPane
              tab={
                <div
                  style={{ width: "100%", textAlign: "center" }}
                  className="px-4 py-2"
                >
                  Giao xe{" "}
                  <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-sm ml-1">
                    {transportingCount}
                  </span>
                </div>
              }
              key="transporting"
            />
            <TabPane
              tab={
                <div
                  style={{ width: "100%", textAlign: "center" }}
                  className="px-4 py-2"
                >
                  Đang thuê{" "}
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-sm ml-1">
                    {activeCount}
                  </span>
                </div>
              }
              key="active"
            />
            <TabPane
              tab={
                <div
                  style={{ width: "100%", textAlign: "center" }}
                  className="px-4 py-2"
                >
                  Hoàn thành{" "}
                  <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full text-sm ml-1">
                    {completedCount}
                  </span>
                </div>
              }
              key="completed"
            />
            <TabPane
              tab={
                <div
                  style={{ width: "100%", textAlign: "center" }}
                  className="px-4 py-2"
                >
                  Đã hủy{" "}
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm ml-1">
                    {canceledCount}
                  </span>
                </div>
              }
              key="canceled"
            />
          </Tabs>
        </div>
      </div>

      {/* Content area với background trắng */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {visibleBookings.length > 0 ? (
            <>
              {visibleBookings.map((booking, index) => (
                <div
                  key={`${booking._id}-${index}`}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <VehicleRentalCard info={booking} accessToken={accessToken} />
                </div>
              ))}

              {/* Element này sẽ được sử dụng để phát hiện khi scroll đến cuối */}
              <div ref={loaderRef} className="py-2 text-center">
                {loading && (
                  <div className="flex justify-center items-center py-4">
                    <Spin size="default" />
                  </div>
                )}
                {!loading && !hasMore && visibleBookings.length > 5 && (
                  <div className="text-gray-500 text-sm py-2">
                    Đã hiển thị tất cả đơn hàng
                  </div>
                )}
              </div>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500">Không có đơn hàng nào</span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

BookingHistoryPage.Layout = ProfileLayout;
