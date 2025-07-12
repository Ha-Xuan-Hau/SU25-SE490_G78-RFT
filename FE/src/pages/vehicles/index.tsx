"use client";

import { useEffect, useState } from "react";
import VehicleFilter from "./_components/VehicleFilter";
import VehicleListing from "./_components/VehicleList";
import type { VehicleFilters, Vehicle } from "@/types/vehicle";
import { getVehicles } from "@/apis/vehicle.api";

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

const ListVehiclePage = () => {
  const [filters, setFilters] = useState<VehicleFilters>({
    vehicleType: undefined,
    maxRating: undefined,
    shipToAddress: false,
    hasDriver: false,
    city: undefined,
    district: undefined,
    ward: undefined,
    minPrice: 0,
    maxPrice: 3000000,
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [errorVehicles, setErrorVehicles] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1); // UI sử dụng 1-based
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  // Hàm này sẽ được truyền xuống VehicleFilter để nhận kết quả tìm kiếm
  const handleApplyFilters = (
    fetchedVehicles: Vehicle[],
    loading: boolean,
    error: string | null,
    paginationInfo?: PaginationInfo
  ) => {
    setVehicles(fetchedVehicles);
    setIsLoadingVehicles(loading);
    setErrorVehicles(error);
    if (paginationInfo) {
      setTotalItems(paginationInfo.totalItems);
      setCurrentPage(paginationInfo.currentPage + 1); // Backend 0-based, UI 1-based
    }
  };

  // Hàm xử lý thay đổi trang
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    setIsLoadingVehicles(true);
    setErrorVehicles(null);
    try {
      const result = await getVehicles({
        ...filters,
        page: page - 1,
        size: pageSize,
      });
      const vehicles = Array.isArray(result)
        ? result
        : result.content || result.vehicles || [];
      setVehicles(vehicles);
      setTotalItems(result.totalItems || vehicles.length);
    } catch (err) {
      setErrorVehicles((err as Error).message || "Không thể tải danh sách xe.");
    } finally {
      setIsLoadingVehicles(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // useEffect để fetch dữ liệu ban đầu khi component mount
  useEffect(() => {
    const fetchInitialVehicles = async () => {
      setIsLoadingVehicles(true);
      setErrorVehicles(null);
      try {
        const initialVehicles = await getVehicles();

        // getVehicles() trả về array đơn giản, không phải pagination format
        const vehicles = Array.isArray(initialVehicles)
          ? initialVehicles
          : initialVehicles.content || initialVehicles.vehicles || [];

        setVehicles(vehicles);
        setTotalItems(vehicles.length);
        setCurrentPage(1); // Reset về trang 1

        console.log("Initial vehicles loaded:", vehicles.length);
      } catch (err) {
        console.error("Lỗi khi tải xe ban đầu:", err);
        setErrorVehicles(
          (err as Error).message || "Không thể tải danh sách xe ban đầu."
        );
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchInitialVehicles();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log("Vehicles state changed:", {
      vehiclesCount: vehicles.length,
      totalItems,
      currentPage,
      isLoading: isLoadingVehicles,
      error: errorVehicles,
    });
  }, [vehicles, totalItems, currentPage, isLoadingVehicles, errorVehicles]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Filter Sidebar */}
          <div className="xl:w-80 flex-shrink-0">
            <VehicleFilter
              filters={filters}
              setFilters={setFilters}
              onApplyFilters={handleApplyFilters}
            />
          </div>

          {/* Vehicle List - Tận dụng không gian còn lại */}
          <div className="flex-1">
            <VehicleListing
              vehicles={vehicles}
              isLoading={isLoadingVehicles}
              error={errorVehicles}
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ListVehiclePage;
