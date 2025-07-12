"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { VehicleRentalCard } from "@/components/VehicleRentalCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getUserBookings } from "@/apis/booking.api";
import { getRatingByBookingAndUser, upUserRating } from "@/apis/booking.api";

import { showError, showSuccess } from "@/utils/toast.utils";
import { Empty, Spin } from "antd";
import RatingModal from "@/components/RatingModal";

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
  UNPAID: "Chờ thanh toán",
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận", // Changed from "Đã duyệt" to "Đã xác nhận"
  DELIVERING: "Đang giao xe",
  DELIVERED: "Đang giao xe", // Add DELIVERED mapping
  RECEIVED_BY_CUSTOMER: "Đang thực hiện",
  RETURNED: "Đã trả xe",
  COMPLETED: "Đã tất toán",
  CANCELLED: "Đã hủy",
  REJECTED: "Đã từ chối",
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

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRatingMap, setCurrentRatingMap] = useState<Record<string, any>>(
    {}
  );

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

  useEffect(() => {
    setUserId(getUserIdFromToken());
  }, [accessToken, getUserIdFromToken]);

  const handleOpenRating = async (booking: Booking) => {
    setSelectedBooking(booking);
    if (userId) {
      try {
        const rating = await getRatingByBookingAndUser(booking._id, userId);
        setCurrentRatingMap((prev) => ({
          ...prev,
          [booking._id]: rating,
        }));
      } catch {
        setCurrentRatingMap((prev) => ({
          ...prev,
          [booking._id]: null,
        }));
      }
    }
    setRatingModalOpen(true);
  };

  const handleCloseRating = () => {
    setRatingModalOpen(false);
    setSelectedBooking(null);
  };

  const handleSubmitRating = async (star: number, comment: string) => {
    if (!selectedBooking || !userId) return;
    await upUserRating({
      bookingId: selectedBooking._id,
      carId: selectedBooking.carId._id,
      userId,
      star,
      comment,
    });
    showSuccess(
      currentRatingMap[selectedBooking._id]
        ? "Cập nhật đánh giá thành công"
        : "Đánh giá thành công"
    );
    setCurrentRatingMap((prev) => ({
      ...prev,
      [selectedBooking._id]: { star, comment },
    }));
    handleCloseRating();
  };

  useEffect(() => {
    // Sau khi fetch bookingHistory xong:
    const fetchRatings = async () => {
      if (!userId) return;
      const map: Record<string, any> = {};
      await Promise.all(
        bookingHistory.map(async (booking) => {
          try {
            const rating = await getRatingByBookingAndUser(booking._id, userId);
            if (rating) map[booking._id] = rating;
          } catch {
            // Không có rating thì bỏ qua
          }
        })
      );
      setCurrentRatingMap(map);
    };

    if (bookingHistory.length && userId) {
      fetchRatings();
    }
  }, [bookingHistory, userId]);

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
    const bookingStatus = booking.status;
    const contractStatus = booking.contract?.status;

    switch (activeTab) {
      case "processing":
        // Include both PENDING and CONFIRMED statuses in Processing tab
        return (
          displayStatus === "Chờ xử lý" ||
          displayStatus === "Đã xác nhận" ||
          bookingStatus === "CONFIRMED"
        );
      case "payment":
        return displayStatus === "Chờ thanh toán"; // UNPAID, WAITING_PAYMENT status
      case "transporting":
        return (
          displayStatus === "Đang giao xe" ||
          bookingStatus === "DELIVERING" ||
          bookingStatus === "DELIVERED" ||
          contractStatus === "DELIVERING" ||
          contractStatus === "DELIVERED"
        ); // DELIVERING, DELIVERED status
      case "active":
        return displayStatus === "Đang thực hiện"; // ACTIVE, IN_PROGRESS status
      case "completed":
        return displayStatus === "Đã tất toán"; // COMPLETED, SETTLEMENT_COMPLETED status
      case "returned":
        return (
          displayStatus === "Đã trả xe" ||
          bookingStatus === "RETURNED" ||
          contractStatus === "RETURNED"
        );
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
    (b: Booking) =>
      getDisplayStatus(b) === "Chờ xử lý" ||
      getDisplayStatus(b) === "Đã xác nhận" ||
      b.status === "CONFIRMED"
  ).length;
  const paymentCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Chờ thanh toán"
  ).length;
  const transportingCount = bookingHistory.filter((b: Booking) => {
    const displayStatus = getDisplayStatus(b);
    const bookingStatus = b.status;
    const contractStatus = b.contract?.status;

    return (
      displayStatus === "Đang giao xe" ||
      bookingStatus === "DELIVERING" ||
      bookingStatus === "DELIVERED" ||
      contractStatus === "DELIVERING" ||
      contractStatus === "DELIVERED"
    );
  }).length;
  const activeCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Đang thực hiện"
  ).length;
  const completedCount = bookingHistory.filter(
    (b: Booking) => getDisplayStatus(b) === "Đã tất toán"
  ).length;
  const returnedCount = bookingHistory.filter(
    (b: Booking) =>
      getDisplayStatus(b) === "Đã trả xe" ||
      b.status === "RETURNED" ||
      b.contract?.status === "RETURNED"
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
      {/* Layout with vertical filter sidebar and content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar filter menu */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-5 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lọc theo trạng thái
          </h2>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => handleTabChange("all")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "all"
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Tất cả</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "all"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {bookingHistory.length}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("payment")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "payment"
                    ? "bg-red-50 text-red-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Chờ thanh toán</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "payment"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {paymentCount}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("processing")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "processing"
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Chờ xử lý</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "processing"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {waitingCount}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("transporting")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "transporting"
                    ? "bg-yellow-50 text-yellow-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Giao xe</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "transporting"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {transportingCount}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("active")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "active"
                    ? "bg-green-50 text-green-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Đang thuê</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "active"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {activeCount}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("returned")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "returned"
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Đã trả xe</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "returned"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {returnedCount}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("completed")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "completed"
                    ? "bg-emerald-50 text-emerald-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Hoàn thành</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {completedCount}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => handleTabChange("canceled")}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                  activeTab === "canceled"
                    ? "bg-red-50 text-red-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Đã hủy</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "canceled"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {canceledCount}
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Right side content area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Lịch sử đặt xe
              {activeTab !== "all" && (
                <span
                  className={`ml-2 px-3 py-1 text-sm rounded-full inline-block ${
                    activeTab === "payment"
                      ? "bg-red-100 text-red-600"
                      : activeTab === "processing"
                      ? "bg-orange-100 text-orange-600"
                      : activeTab === "transporting"
                      ? "bg-yellow-100 text-yellow-600"
                      : activeTab === "active"
                      ? "bg-green-100 text-green-600"
                      : activeTab === "returned"
                      ? "bg-blue-100 text-blue-600"
                      : activeTab === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : activeTab === "canceled"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {activeTab === "all"
                    ? "Tất cả"
                    : activeTab === "payment"
                    ? "Chờ thanh toán"
                    : activeTab === "processing"
                    ? "Chờ xử lý"
                    : activeTab === "transporting"
                    ? "Đang giao xe"
                    : activeTab === "active"
                    ? "Đang thuê"
                    : activeTab === "returned"
                    ? "Đã trả xe"
                    : activeTab === "completed"
                    ? "Hoàn thành"
                    : activeTab === "canceled"
                    ? "Đã hủy"
                    : ""}
                </span>
              )}
            </h1>
            <div className="text-sm text-gray-500 mt-1">
              {filteredBookings.length} đơn hàng
            </div>
          </div>

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
                <div className="grid gap-4">
                  {visibleBookings.map((booking: Booking, index: number) => (
                    <div
                      key={`${booking._id}-${index}`}
                      className="border-b border-gray-100 pb-4 last:border-0"
                    >
                      <VehicleRentalCard
                        info={booking}
                        accessToken={accessToken}
                        onOpenRating={() => handleOpenRating(booking)}
                        isRated={!!currentRatingMap[booking._id]}
                      />
                    </div>
                  ))}
                </div>

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
              <div className="py-8">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">
                        {activeTab !== "all"
                          ? `Không có đơn hàng nào ở trạng thái ${
                              activeTab === "payment"
                                ? "Chờ thanh toán"
                                : activeTab === "processing"
                                ? "Chờ xử lý"
                                : activeTab === "transporting"
                                ? "Đã nhận được xe"
                                : activeTab === "active"
                                ? "Đang thuê"
                                : activeTab === "returned"
                                ? "Đã trả xe"
                                : activeTab === "completed"
                                ? "Hoàn thành"
                                : activeTab === "canceled"
                                ? "Đã hủy"
                                : ""
                            }`
                          : "Không có đơn hàng nào"}
                      </p>
                      {activeTab !== "all" && (
                        <button
                          onClick={() => handleTabChange("all")}
                          className="text-blue-500 hover:text-blue-700 underline"
                        >
                          Xem tất cả đơn hàng
                        </button>
                      )}
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <RatingModal
        open={ratingModalOpen}
        handleCancel={handleCloseRating}
        bookingId={selectedBooking?._id || ""}
        carId={selectedBooking?.carId._id || ""}
        initialStar={
          selectedBooking && currentRatingMap[selectedBooking._id]?.star
        }
        initialComment={
          selectedBooking && currentRatingMap[selectedBooking._id]?.comment
        }
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}

BookingHistoryPage.Layout = ProfileLayout;
