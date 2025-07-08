"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { VehicleRentalCard } from "@/components/VehicleRentalCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getUserBookings } from "@/apis/booking.api";
import { showError } from "@/utils/toast.utils";
import { Tabs, Empty, Spin } from "antd";

const { TabPane } = Tabs;

// Backend booking interface (based on the API response format)
interface BackendBooking {
  id: string;
  userId: string;
  userName: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleType: string;
  timeBookingStart: number[]; // [year, month, day, hour, minute]
  timeBookingEnd: number[]; // [year, month, day, hour, minute]
  phoneNumber: string;
  address: string;
  codeTransaction: string;
  timeTransaction: number[]; // [year, month, day, hour, minute, second]
  totalCost: number;
  status: string;
  createdAt: number[];
  updatedAt: number[];
}

// Frontend booking interface (transformed for UI display)
interface Booking {
  _id: string;
  status: string;
  carId: {
    _id: string;
    model: {
      name: string;
    };
    yearManufacture: number;
    thumb: string;
  };
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number;
  contract?: {
    status: string;
  };
}

// Transform backend booking to frontend format
const transformBooking = (backendBooking: BackendBooking): Booking => {
  // Convert array time format to ISO string
  const convertArrayToISO = (timeArray: number[]): string => {
    const [year, month, day, hour = 0, minute = 0, second = 0] = timeArray;
    return new Date(year, month - 1, day, hour, minute, second).toISOString();
  };

  return {
    _id: backendBooking.id,
    status: statusMapping[backendBooking.status] || backendBooking.status,
    carId: {
      _id: backendBooking.vehicleId,
      model: {
        name: `${backendBooking.vehicleType} - ${backendBooking.vehicleLicensePlate}`, // Use license plate as name since we don't have model info
      },
      yearManufacture: new Date().getFullYear(), // Default to current year since we don't have this info
      thumb: "/images/demo1.png", // Default image since we don't have vehicle images from this API
    },
    timeBookingStart: convertArrayToISO(backendBooking.timeBookingStart),
    timeBookingEnd: convertArrayToISO(backendBooking.timeBookingEnd),
    totalCost: backendBooking.totalCost,
    contract: {
      status: statusMapping[backendBooking.status] || backendBooking.status,
    },
  };
};

// Status mapping from backend to UI
const statusMapping: { [key: string]: string } = {
  // Main booking statuses
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã duyệt",
  DELIVERING: "Đang giao xe",
  ACTIVE: "Đang thực hiện",
  COMPLETED: "Đã tất toán",
  CANCELLED: "Đã hủy",
  REJECTED: "Đã từ chối",
  UNPAID: "Chờ thanh toán",

  // Contract statuses
  WAITING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  DELIVERING_VEHICLE: "Đang giao xe",
  VEHICLE_DELIVERED: "Đã giao xe",
  IN_PROGRESS: "Đang thực hiện",
  RETURNING_VEHICLE: "Đang trả xe",
  VEHICLE_RETURNED: "Đã trả xe",
  SETTLEMENT_COMPLETED: "Đã tất toán",
  EXPIRED: "Hết hạn",
  DEPOSIT_REFUNDED: "Đã hoàn cọc",
};

// Get display status from booking data
const getDisplayStatus = (booking: Booking): string => {
  // Priority: contract status > booking status
  const contractStatus = booking.contract?.status;
  const bookingStatus = booking.status;

  // Map contract status first
  if (contractStatus && statusMapping[contractStatus]) {
    return statusMapping[contractStatus];
  }

  // Fall back to booking status
  if (bookingStatus && statusMapping[bookingStatus]) {
    return statusMapping[bookingStatus];
  }

  // Return original status if no mapping found
  return contractStatus || bookingStatus || "Không xác định";
};

export default function BookingHistoryPage() {
  const [accessToken] = useLocalStorage("access_token", null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Get userId from JWT token
  const getUserIdFromToken = useCallback(() => {
    if (!accessToken) return null;

    try {
      const token =
        typeof accessToken === "string" ? accessToken : JSON.parse(accessToken);
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) return null;

      const payload = tokenParts[1];
      const decodedData = JSON.parse(atob(payload));
      return decodedData.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, [accessToken]);

  // Fetch booking data from API
  const fetchBookingHistory = useCallback(async () => {
    const userId = getUserIdFromToken();
    if (!userId) return;

    try {
      setInitialLoading(true);
      setError(null);
      const data = await getUserBookings(userId);

      // Transform backend data to frontend format
      const backendBookings = (data as BackendBooking[]) || [];
      const transformedBookings = backendBookings.map(transformBooking);
      setBookingHistory(transformedBookings);
    } catch (err) {
      console.error("Error fetching booking history:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi tải dữ liệu";
      setError(errorMessage);
      showError("Không thể tải lịch sử đặt xe");
    } finally {
      setInitialLoading(false);
    }
  }, [getUserIdFromToken]);

  // Load data when token is available
  useEffect(() => {
    if (accessToken) {
      fetchBookingHistory();
    }
  }, [accessToken, fetchBookingHistory]);

  // Lọc danh sách dựa trên tab đang chọn
  const filteredBookings = bookingHistory.filter((booking: Booking) => {
    const displayStatus = getDisplayStatus(booking);

    switch (activeTab) {
      case "processing":
        return displayStatus === "Chờ xử lý"; // PENDING status
      case "payment":
        return displayStatus === "Chờ thanh toán"; // UNPAID, WAITING_PAYMENT status
      case "transporting":
        return displayStatus === "Đang giao xe"; // DELIVERING, DELIVERING_VEHICLE status
      case "active":
        return displayStatus === "Đang thực hiện"; // ACTIVE, IN_PROGRESS status
      case "completed":
        return displayStatus === "Đã tất toán"; // COMPLETED, SETTLEMENT_COMPLETED status
      case "canceled":
        return displayStatus === "Đã hủy"; // CANCELLED status
      default:
        return true; // Tab "Tất cả" - show all bookings
    }
  });

  const visibleBookings = filteredBookings.slice(0, visibleCount);

  const hasMore = visibleCount < filteredBookings.length;

  // Đếm số lượng cho từng loại
  const waitingCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Chờ xử lý"
  ).length;
  const paymentCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Chờ thanh toán"
  ).length;
  const transportingCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Đang giao xe"
  ).length;
  const activeCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Đang thực hiện"
  ).length;
  const completedCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Đã tất toán"
  ).length;
  const canceledCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Đã hủy"
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
                    {bookingHistory.length}
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
                  Chờ thanh toán{" "}
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm ml-1">
                    {paymentCount}
                  </span>
                </div>
              }
              key="payment"
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
          {initialLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="large" />
              <span className="ml-3 text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p className="text-red-500 mb-2">{error}</p>
                    <button
                      onClick={fetchBookingHistory}
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      Thử lại
                    </button>
                  </div>
                }
              />
            </div>
          ) : visibleBookings.length > 0 ? (
            <>
              {visibleBookings.map((booking: Booking, index: number) => (
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
