"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import VehicleListing from "@/pages/vehicles/_components/VehicleList";
import type { Vehicle } from "@/types/vehicle";
import { ChevronUp, ArrowLeft, User, AlertCircle } from "lucide-react";
import { getVehiclesByUserId } from "@/apis/vehicle.api";

interface UserInfo {
  id: string;
  name?: string;
  avatar?: string;
}

const ITEMS_PER_PAGE = 12;

const ShopPage = () => {
  const params = useParams();
  const router = useRouter();

  // Get userId from params
  const userId = params?.id as string | undefined;

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [errorVehicles, setErrorVehicles] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalElements = allVehicles.length;
    const totalPages = Math.ceil(totalElements / ITEMS_PER_PAGE);

    return {
      totalElements,
      totalPages,
      currentPage: currentPage - 1,
      size: ITEMS_PER_PAGE,
    };
  }, [allVehicles.length, currentPage]);

  // Get vehicles for current page
  const currentPageVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allVehicles.slice(startIndex, endIndex);
  }, [allVehicles, currentPage]);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch all vehicles by user ID
  const fetchUserVehicles = useCallback(async () => {
    if (!userId) {
      setErrorVehicles("ID cửa hàng không hợp lệ");
      return;
    }

    setIsLoadingVehicles(true);
    setErrorVehicles(null);

    try {
      const vehicles = await getVehiclesByUserId(userId);

      if (Array.isArray(vehicles)) {
        setAllVehicles(vehicles);

        // Extract user info from the first vehicle if available
        if (vehicles.length > 0) {
          const firstVehicle = vehicles[0];
          setUserInfo({
            id: userId,
            name: firstVehicle.userName || `Cửa hàng ${userId}`,
            avatar: firstVehicle.userProfilePicture || undefined,
          });
        } else {
          // Set default info if no vehicles
          setUserInfo({
            id: userId,
            name: `Cửa hàng ${userId}`,
            avatar: undefined,
          });
        }
      } else {
        console.error("Invalid vehicles data:", vehicles);
        setAllVehicles([]);
        // Set default info
        setUserInfo({
          id: userId,
          name: `Cửa hàng ${userId}`,
          avatar: undefined,
        });
      }

      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching shop vehicles:", err);
      setErrorVehicles(
        (err as Error).message || "Không thể tải danh sách xe của cửa hàng."
      );
      setAllVehicles([]);
      // Set default info on error
      setUserInfo({
        id: userId,
        name: `Cửa hàng ${userId}`,
        avatar: undefined,
      });
    } finally {
      setIsLoadingVehicles(false);
    }
  }, [userId]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    scrollToTop();
  }, []);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchUserVehicles();
    } else {
      console.log("No shop ID found in params:", params);
      setErrorVehicles("Không tìm thấy ID cửa hàng");
    }
  }, [userId, fetchUserVehicles, params]);

  // Early return if no userId
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-red-50 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Lỗi: Không tìm thấy cửa hàng
            </h3>
            <p className="text-gray-600 mb-4">
              ID cửa hàng không hợp lệ hoặc không tồn tại.
            </p>
            <button
              onClick={() => router.push("/vehicles")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách xe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {userInfo?.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name || "Shop"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default icon if image fails to load
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        );
                      }}
                    />
                  ) : null}
                  <User
                    className={`w-6 h-6 text-blue-600 ${
                      userInfo?.avatar ? "hidden" : ""
                    }`}
                  />
                </div>

                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                    {userInfo?.name || `Cửa hàng`}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {!isLoadingVehicles && allVehicles.length > 0
                      ? `${allVehicles.length} xe cho thuê`
                      : isLoadingVehicles
                      ? "Đang tải..."
                      : "Chưa có xe nào"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Vehicle List */}
          <VehicleListing
            vehicles={currentPageVehicles}
            isLoading={isLoadingVehicles}
            error={errorVehicles}
            currentPage={currentPage}
            totalItems={paginationInfo.totalElements}
            pageSize={paginationInfo.size}
            onPageChange={handlePageChange}
          />

          {/* Empty state */}
          {!isLoadingVehicles && allVehicles.length === 0 && !errorVehicles && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Cửa hàng chưa có xe nào
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    {userInfo?.name || "Cửa hàng này"} hiện chưa có xe nào được
                    đăng tải. Vui lòng quay lại sau hoặc xem các cửa hàng khác.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => router.push("/vehicles")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Xem xe từ các cửa hàng khác →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={fetchUserVehicles}
          className="w-12 h-12 bg-white border border-gray-200 text-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
          aria-label="Làm mới"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110"
          aria-label="Cuộn lên đầu trang"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ShopPage;
