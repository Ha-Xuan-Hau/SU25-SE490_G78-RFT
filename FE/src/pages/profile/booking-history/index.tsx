"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { VehicleRentalCard } from "@/components/vehicleRent/VehicleRentalCard";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getUserBookings, getBookingDetail } from "@/apis/booking.api";
import { getRatingByBookingAndUser, upUserRating } from "@/apis/booking.api";
import { BookingDetail } from "@/types/booking";

import { showError, showSuccess } from "@/utils/toast.utils";
import { Empty, Spin } from "antd";
import RatingModal from "@/components/vehicleRent/RatingModal";
import VehicleSelectionModal from "@/components/vehicleRent/VehicleSelectionModal";

// Vehicle type từ BookingDetail
type Vehicle = BookingDetail["vehicles"][0];

// Backend booking interface (based on the API response format)
interface BackendBooking {
  id: string;
  userId: string;
  userName: string;
  vehicleId: string;
  vehicleImage: string;
  vehicleLicensePlate: string;
  vehicleType: string;
  timeBookingStart: number[];
  timeBookingEnd: number[];
  phoneNumber: string;
  address: string;
  codeTransaction: string;
  timeTransaction: number[];
  totalCost: number;
  status: string;
  createdAt: number[];
  updatedAt: number[];
  vehicleThumb: string;
}

// Frontend booking interface (transformed for UI display)
interface Booking {
  _id: string; // Giữ _id cho booking vì API trả về id
  status: string;
  vehicleId: {
    _id: string;
    model: {
      name: string;
    };
    yearManufacture: number;
    vehicleThumb: string;
    vehicleImage: string;
    vehicleLicensePlate: string;
  };
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number;
  contract?: {
    status: string;
  };
  vehicles?: Vehicle[];
}

// Transform backend booking to frontend format
const transformBooking = (backendBooking: BackendBooking): Booking => {
  const convertArrayToISO = (timeArray: number[]): string => {
    const [year, month, day, hour = 0, minute = 0, second = 0] = timeArray;
    return new Date(year, month - 1, day, hour, minute, second).toISOString();
  };

  return {
    _id: backendBooking.id, // API trả về id, chuyển thành _id
    status: statusMapping[backendBooking.status] || backendBooking.status,
    vehicleId: {
      _id: backendBooking.vehicleId,
      model: {
        name: backendBooking.vehicleId,
      },
      yearManufacture: new Date().getFullYear(),
      vehicleThumb: backendBooking.vehicleThumb,
      vehicleImage: backendBooking.vehicleImage || "/images/demo1.png",
      vehicleLicensePlate:
        backendBooking.vehicleLicensePlate || "Không xác định",
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
  UNPAID: "Chờ thanh toán",
  // PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  DELIVERING: "Đang giao xe",
  DELIVERED: "Đang giao xe",
  RECEIVED_BY_CUSTOMER: "Đang thực hiện",
  RETURNED: "Đã trả xe",
  COMPLETED: "Đã tất toán",
  CANCELLED: "Đã hủy",
  REJECTED: "Đã từ chối",
};

// Get display status from booking data
const getDisplayStatus = (booking: Booking): string => {
  const contractStatus = booking.contract?.status;
  const bookingStatus = booking.status;

  if (contractStatus && statusMapping[contractStatus]) {
    return statusMapping[contractStatus];
  }

  if (bookingStatus && statusMapping[bookingStatus]) {
    return statusMapping[bookingStatus];
  }

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

  // Rating modal states
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRatingMap, setCurrentRatingMap] = useState<Record<string, any>>(
    {}
  );

  // Vehicle selection modal states
  const [vehicleSelectionModal, setVehicleSelectionModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<
    Record<string, Vehicle[]>
  >({});

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

  // Fetch booking details for vehicles data
  const fetchBookingDetails = useCallback(async (bookingIds: string[]) => {
    const detailsPromises = bookingIds.map(async (bookingId) => {
      try {
        const detail = (await getBookingDetail(bookingId)) as BookingDetail;
        return { bookingId, vehicles: detail.vehicles || [] };
      } catch (error) {
        console.error(`Error fetching booking detail for ${bookingId}:`, error);
        return { bookingId, vehicles: [] };
      }
    });

    const results = await Promise.all(detailsPromises);
    const detailsMap: Record<string, Vehicle[]> = {};
    results.forEach(({ bookingId, vehicles }) => {
      detailsMap[bookingId] = vehicles;
    });

    setBookingDetails(detailsMap);
  }, []);

  // Handle opening rating modal
  const handleOpenRating = async (booking: Booking, vehicleId?: string) => {
    console.log("handleOpenRating called with:", {
      bookingId: booking._id,
      vehicleId,
    });
    setSelectedBooking(booking);

    // If no vehicleId provided, check if there are multiple vehicles
    if (!vehicleId) {
      const vehicles = bookingDetails[booking._id] || [];
      if (vehicles.length > 1) {
        setVehicleSelectionModal(true);
        return;
      } else {
        // Single vehicle case
        vehicleId = vehicles[0]?.id || booking.vehicleId._id;
      }
    }

    console.log("Selected vehicleId:", vehicleId);
    setSelectedVehicleId(vehicleId);

    // Fetch ratings for the booking and find the specific vehicle rating
    if (vehicleId && userId) {
      try {
        // API returns array of ratings for the booking
        const ratingsResponse = await getRatingByBookingAndUser(
          booking._id,
          userId
        );
        console.log("Fetched ratings response:", ratingsResponse);

        // Handle both array and single object responses
        const ratings = Array.isArray(ratingsResponse)
          ? ratingsResponse
          : [ratingsResponse];

        // Find rating for specific vehicle
        const vehicleRating = ratings.find(
          (rating: any) => rating.vehicleId === vehicleId
        );

        console.log("Found vehicle rating:", vehicleRating);

        // Store all ratings from this booking in the map
        ratings.forEach((rating: any) => {
          const ratingKey = `${booking._id}_${rating.vehicleId}`;
          setCurrentRatingMap((prev) => ({
            ...prev,
            [ratingKey]: rating,
          }));
        });
      } catch (error) {
        console.log("No ratings found for booking:", booking._id);
        // Set null for this specific vehicle
        const ratingKey = `${booking._id}_${vehicleId}`;
        setCurrentRatingMap((prev) => ({
          ...prev,
          [ratingKey]: null,
        }));
      }
    }

    setRatingModalOpen(true);
  };

  const handleCloseRating = () => {
    setRatingModalOpen(false);
    setSelectedBooking(null);
    setSelectedVehicleId(null);
  };

  const handleSubmitRating = async (star: number, comment: string) => {
    if (!selectedBooking || !userId || !selectedVehicleId) return;

    try {
      await upUserRating({
        bookingId: selectedBooking._id,
        vehicleId: selectedVehicleId,
        userId,
        star,
        comment,
      });

      const ratingKey = `${selectedBooking._id}_${selectedVehicleId}`;
      const isExistingRating = currentRatingMap[ratingKey];

      showSuccess(
        isExistingRating
          ? "Cập nhật đánh giá thành công"
          : "Đánh giá thành công"
      );

      // Update rating map with consistent key
      setCurrentRatingMap((prev) => ({
        ...prev,
        [ratingKey]: { star, comment },
      }));

      handleCloseRating();
    } catch (error) {
      showError("Có lỗi xảy ra khi gửi đánh giá");
    }
  };

  // Handle vehicle selection for rating
  const handleSelectVehicleForRating = (vehicle: Vehicle) => {
    setVehicleSelectionModal(false);
    handleOpenRating(selectedBooking!, vehicle.id); // Sử dụng id
  };

  // Fetch ratings for all vehicles in all bookings
  useEffect(() => {
    const fetchAllRatings = async () => {
      if (!userId || !bookingHistory.length) return;

      const ratingPromises: Promise<void>[] = [];

      bookingHistory.forEach((booking) => {
        // Fetch ratings for each booking (returns array of ratings)
        ratingPromises.push(
          getRatingByBookingAndUser(booking._id, userId)
            .then((ratingsResponse) => {
              // Handle both array and single object responses
              const ratings = Array.isArray(ratingsResponse)
                ? ratingsResponse
                : [ratingsResponse];

              console.log(`Ratings for booking ${booking._id}:`, ratings);

              // Store each rating in the map with vehicleId as key
              ratings.forEach((rating: any) => {
                if (rating && rating.vehicleId) {
                  const ratingKey = `${booking._id}_${rating.vehicleId}`;
                  setCurrentRatingMap((prev) => ({
                    ...prev,
                    [ratingKey]: rating,
                  }));
                }
              });
            })
            .catch((error) => {
              console.log(
                `No ratings found for booking ${booking._id}:`,
                error
              );
              // Don't set anything in the map for failed requests
            })
        );
      });

      await Promise.all(ratingPromises);
    };

    fetchAllRatings();
  }, [bookingHistory, bookingDetails, userId]);

  // Fetch booking data from API
  const fetchBookingHistory = useCallback(async () => {
    const userId = getUserIdFromToken();
    if (!userId) return;

    try {
      setInitialLoading(true);
      setError(null);
      const data = await getUserBookings(userId);

      const backendBookings = (data as BackendBooking[]) || [];
      const transformedBookings = backendBookings.map(transformBooking);
      setBookingHistory(transformedBookings);

      // Fetch booking details for vehicles data
      const bookingIds = transformedBookings.map((booking) => booking._id);
      await fetchBookingDetails(bookingIds);
    } catch (err) {
      console.error("Error fetching booking history:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Lỗi tải dữ liệu";
      setError(errorMessage);
      showError("Không thể tải lịch sử đặt xe");
    } finally {
      setInitialLoading(false);
    }
  }, [getUserIdFromToken, fetchBookingDetails]);

  // Load data when token is available
  useEffect(() => {
    if (accessToken) {
      fetchBookingHistory();
    }
  }, [accessToken, fetchBookingHistory]);

  // Check if booking has any rating
  const hasAnyRating = (booking: Booking) => {
    const vehicles = bookingDetails[booking._id] || [];

    if (vehicles.length > 0) {
      // Check if any vehicle in this booking has a rating
      return vehicles.some((vehicle) => {
        const ratingKey = `${booking._id}_${vehicle.id}`;
        return currentRatingMap[ratingKey];
      });
    }

    // Fallback for bookings without vehicle details
    const ratingKey = `${booking._id}_${booking.vehicleId._id}`;
    return !!currentRatingMap[ratingKey];
  };

  // Lọc danh sách dựa trên tab đang chọn
  const filteredBookings = bookingHistory.filter((booking: Booking) => {
    const displayStatus = getDisplayStatus(booking);
    const bookingStatus = booking.status;
    const contractStatus = booking.contract?.status;

    switch (activeTab) {
      case "processing":
        return (
          // displayStatus === "Chờ xử lý" ||
          displayStatus === "Đã xác nhận" || bookingStatus === "CONFIRMED"
        );
      case "payment":
        return displayStatus === "Chờ thanh toán";
      case "transporting":
        return (
          displayStatus === "Đang giao xe" ||
          bookingStatus === "DELIVERING" ||
          bookingStatus === "DELIVERED" ||
          contractStatus === "DELIVERING" ||
          contractStatus === "DELIVERED"
        );
      case "active":
        return displayStatus === "Đang thực hiện";
      case "completed":
        return displayStatus === "Đã tất toán";
      case "returned":
        return (
          displayStatus === "Đã trả xe" ||
          bookingStatus === "RETURNED" ||
          contractStatus === "RETURNED"
        );
      case "canceled":
        return displayStatus === "Đã hủy";
      default:
        return true;
    }
  });

  const visibleBookings = filteredBookings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBookings.length;

  // Đếm số lượng cho từng loại (code giữ nguyên...)
  const waitingCount = bookingHistory.filter(
    (b: Booking) =>
      // getDisplayStatus(b) === "Chờ xử lý" ||
      getDisplayStatus(b) === "Đã xác nhận" || b.status === "CONFIRMED"
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

    setTimeout(() => {
      setVisibleCount((prev) => prev + 5);
      setLoading(false);
    }, 800);
  }, [loading, hasMore]);

  // Xử lý tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setVisibleCount(5);
  }, []);

  // Thêm hook để listen booking events
  const { on } = useRealtimeEvents();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = on("BOOKING_STATUS_CHANGE", (event) => {
      console.log("Booking status changed:", event);
      // Đảm bảo gọi đúng function
      fetchBookingHistory(); // không cần await ở đây
    });

    return unsubscribe;
  }, [userId, on, fetchBookingHistory]); // Thêm fetchBookingHistory vào dependencies

  useEffect(() => {
    if (!userId) {
      console.log("No userId, skipping WebSocket setup");
      return;
    }

    console.log("Setting up WebSocket listeners for user:", userId);

    const unsubscribe = on("BOOKING_STATUS_CHANGE", (event) => {
      console.log("User - Booking status changed:", event);
      console.log("Event payload:", event.payload);
      console.log("Calling fetchBookingHistory...");

      fetchBookingHistory()
        .then(() => {
          console.log("fetchBookingHistory completed");
        })
        .catch((error) => {
          console.error("fetchBookingHistory error:", error);
        });
    });

    return () => {
      console.log("Cleaning up WebSocket listener");
      unsubscribe();
    };
  }, [userId, on, fetchBookingHistory]);

  // Thiết lập Intersection Observer
  useEffect(() => {
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
                    ? "bg-cyan-50 text-cyan-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Đã xác nhận</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === "processing"
                      ? "bg-cyan-100 text-cyan-600"
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
          {/* Thông báo đơn chưa thanh toán - phiên bản đơn giản */}
          {paymentCount > 0 && (
            <div className="mb-4 text-center">
              <h1 className="text-red-600 font-medium text-xl bg-red-50 border border-red-200 rounded-lg py-3 px-4">
                ⚠️ Bạn có <span className="font-bold">{paymentCount}</span> đơn
                chưa thanh toán, yêu cầu thanh toán nếu không đơn đặt xe sẽ bị
                xóa sau 5 phút
                <button
                  onClick={() => handleTabChange("payment")}
                  className="ml-2 text-red-700 underline hover:text-red-800 font-semibold"
                >
                  Xem ngay →
                </button>
              </h1>
            </div>
          )}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Lịch sử đặt xe
              {activeTab !== "all" && (
                <span
                  className={`ml-2 px-3 py-1 text-sm rounded-full inline-block ${
                    activeTab === "payment"
                      ? "bg-red-100 text-red-600"
                      : activeTab === "processing"
                      ? "bg-cyan-100 text-cyan-600"
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
                    ? "Đã xác nhận"
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
                  {visibleBookings.map((booking: Booking, index: number) => {
                    // Attach vehicles data to booking
                    const bookingWithVehicles = {
                      ...booking,
                      vehicles: bookingDetails[booking._id] || [],
                    };

                    return (
                      <div
                        key={`${booking._id}-${index}`}
                        className="border-b border-gray-100 pb-4 last:border-0"
                      >
                        <VehicleRentalCard
                          info={bookingWithVehicles}
                          accessToken={accessToken}
                          onOpenRating={(vehicleId) =>
                            handleOpenRating(booking, vehicleId)
                          }
                          isRated={hasAnyRating(booking)}
                          currentRatingMap={currentRatingMap}
                        />
                      </div>
                    );
                  })}
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
                                ? "Đã xác nhận"
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

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        open={vehicleSelectionModal}
        onCancel={() => setVehicleSelectionModal(false)}
        vehicles={
          selectedBooking ? bookingDetails[selectedBooking._id] || [] : []
        }
        onSelectVehicle={handleSelectVehicleForRating}
        currentRatingMap={currentRatingMap}
        bookingId={selectedBooking?._id || ""} // Add this line
      />

      {/* Rating Modal */}
      <RatingModal
        open={ratingModalOpen}
        handleCancel={handleCloseRating}
        bookingId={selectedBooking?._id || ""}
        vehicleId={selectedVehicleId || selectedBooking?.vehicleId._id || ""}
        initialStar={(() => {
          if (!selectedVehicleId || !selectedBooking) return undefined;
          const ratingKey = `${selectedBooking._id}_${selectedVehicleId}`;
          const rating = currentRatingMap[ratingKey];
          console.log("RatingModal initialStar:", {
            selectedVehicleId,
            ratingKey,
            rating,
            star: rating?.star,
          });
          return rating?.star;
        })()}
        initialComment={(() => {
          if (!selectedVehicleId || !selectedBooking) return undefined;
          const ratingKey = `${selectedBooking._id}_${selectedVehicleId}`;
          const rating = currentRatingMap[ratingKey];
          console.log("RatingModal initialComment:", {
            selectedVehicleId,
            ratingKey,
            rating,
            comment: rating?.comment,
          });
          return rating?.comment;
        })()}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}

BookingHistoryPage.Layout = ProfileLayout;
