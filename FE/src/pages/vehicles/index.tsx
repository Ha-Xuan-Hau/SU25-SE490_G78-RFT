// @/app/vehicles/page.tsx
"use client";

import { useEffect, useState } from "react";
import VehicleFilter from "./_components/VehicleFilter";
import VehicleListing from "./_components/VehicleList";
import type { VehicleFilters, Vehicle } from "@/types/vehicle";
import { Filter, X } from "lucide-react";

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

interface AdvancedSearchState {
  isAdvancedSearch: boolean;
  searchParams: Record<string, unknown>;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 12,
  });

  const [advancedSearchState, setAdvancedSearchState] =
    useState<AdvancedSearchState>({
      isAdvancedSearch: false,
      searchParams: {},
    });

  // Mobile filter state
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const handleSearchResults = (
    searchResults: Vehicle[],
    loading: boolean,
    error: string | null,
    pagination?: PaginationInfo,
    isAdvanced?: boolean,
    searchParams?: Record<string, unknown>
  ) => {
    setVehicles(searchResults);
    setIsLoadingVehicles(loading);
    setErrorVehicles(error);

    if (pagination) {
      setPaginationInfo(pagination);
      setCurrentPage(pagination.currentPage + 1);
    }

    if (isAdvanced !== undefined && searchParams !== undefined) {
      setAdvancedSearchState({
        isAdvancedSearch: isAdvanced,
        searchParams: searchParams,
      });
    }

    // Đóng mobile filter sau khi search
    setShowMobileFilter(false);
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    setIsLoadingVehicles(true);
    setErrorVehicles(null);

    try {
      let result;

      if (advancedSearchState.isAdvancedSearch) {
        const { advancedSearchVehicles } = await import("@/apis/vehicle.api");

        const searchParams = {
          ...advancedSearchState.searchParams,
          page: page - 1,
          size: 12,
        };

        result = await advancedSearchVehicles(searchParams);
      } else {
        const { basicSearchVehicles } = await import("@/apis/vehicle.api");

        const searchParams = {
          address: filters.city,
          vehicleType: filters.vehicleType,
          page: page - 1,
          size: 12,
        };

        result = await basicSearchVehicles(searchParams);
      }

      setVehicles(result.content || []);

      const newPagination: PaginationInfo = {
        totalElements: result.totalElements || 0,
        totalPages: result.totalPages || 1,
        currentPage: result.number || 0,
        size: result.size || 12,
      };

      setPaginationInfo(newPagination);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Page change error:", err);
      setErrorVehicles((err as Error).message || "Không thể tải trang mới.");
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  useEffect(() => {
    setVehicles([]);
    setPaginationInfo({
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      size: 12,
    });
    setCurrentPage(1);
    setAdvancedSearchState({
      isAdvancedSearch: false,
      searchParams: {},
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 lg:py-6">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilter(true)}
            className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg font-medium"
          >
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc tìm kiếm
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6" data-filter-section>
              <VehicleFilter
                filters={filters}
                setFilters={setFilters}
                onSearchResults={handleSearchResults}
              />
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 w-full lg:w-auto">
            <VehicleListing
              vehicles={vehicles}
              isLoading={isLoadingVehicles}
              error={errorVehicles}
              currentPage={currentPage}
              totalItems={paginationInfo.totalElements}
              pageSize={paginationInfo.size}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilter && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setShowMobileFilter(false)}
          />
          <div className="fixed inset-0 z-50 flex items-end lg:hidden">
            <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-hidden">
              {/* Mobile Filter Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Bộ lọc tìm kiếm
                </h2>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Filter Content */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(90vh - 80px)" }}
              >
                <div className="p-4">
                  <VehicleFilter
                    filters={filters}
                    setFilters={setFilters}
                    onSearchResults={handleSearchResults}
                    isMobile={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ListVehiclePage;
