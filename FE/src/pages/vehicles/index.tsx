// @/app/vehicles/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import VehicleFilter from "./_components/VehicleFilter";
import VehicleListing from "./_components/VehicleList";
import type { VehicleFilters, Vehicle } from "@/types/vehicle";
import { Filter, ChevronUp } from "lucide-react";
import { Drawer } from "antd";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const cityFromUrl = searchParams.get("city");

  const [filters, setFilters] = useState<VehicleFilters>({
    vehicleType: undefined,
    maxRating: undefined,
    shipToAddress: false,
    hasDriver: false,
    city: cityFromUrl ? decodeURIComponent(cityFromUrl) : undefined,
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

  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [hasInitialSearch, setHasInitialSearch] = useState(false);

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

  const handleSearchResults = useCallback(
    (
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
      } else {
        setPaginationInfo({
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          size: 12,
        });
        setCurrentPage(1);
      }

      // ✅ Luôn lưu searchParams cho cả basic và advanced search
      if (searchParams !== undefined) {
        setAdvancedSearchState({
          isAdvancedSearch: isAdvanced || false,
          searchParams: searchParams,
        });
      }

      setShowMobileFilter(false);
    },
    []
  );

  const handlePageChange = useCallback(
    async (page: number) => {
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

          // ✅ Sử dụng searchParams đã lưu từ lần search trước
          const lastSearchParams = advancedSearchState.searchParams;

          // Chỉ build lại nếu chưa có searchParams (initial load)
          const searchParams =
            Object.keys(lastSearchParams).length > 0
              ? {
                  ...lastSearchParams,
                  page: page - 1,
                  size: 12,
                }
              : {
                  // Build từ filters nếu chưa search lần nào
                  address:
                    [filters.ward, filters.district, filters.city]
                      .filter(Boolean)
                      .join(", ") || undefined,
                  vehicleType: filters.vehicleType,
                  pickupDateTime: filters.pickupDateTime,
                  returnDateTime: filters.returnDateTime,
                  page: page - 1,
                  size: 12,
                };

          result = await basicSearchVehicles(searchParams);
        }

        setVehicles(result.content || []);

        // ✅ Luôn cập nhật paginationInfo đầy đủ
        setPaginationInfo({
          totalElements: result.totalElements || 0,
          totalPages: result.totalPages || 0,
          currentPage: result.currentPage || 0,
          size: result.size || 12,
        });

        scrollToTop();
      } catch (err) {
        console.error("Page change error:", err);
        setErrorVehicles((err as Error).message || "Không thể tải trang mới.");
      } finally {
        setIsLoadingVehicles(false);
      }
    },
    [advancedSearchState, filters]
  );

  // Initial load
  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoadingVehicles(true);
      setErrorVehicles(null);

      try {
        const { basicSearchVehicles } = await import("@/apis/vehicle.api");

        // Nếu có city từ URL, search với city đó
        const searchParams = cityFromUrl
          ? {
              address: decodeURIComponent(cityFromUrl),
              page: 0,
              size: 12,
            }
          : {
              page: 0,
              size: 12,
            };

        const result = await basicSearchVehicles(searchParams);

        setVehicles(result.content || []);
        setPaginationInfo({
          totalElements: result.totalElements || 0,
          totalPages: result.totalPages || 0,
          currentPage: result.currentPage || 0,
          size: result.size || 12,
        });

        // Lưu search params nếu có city
        if (cityFromUrl) {
          setAdvancedSearchState({
            isAdvancedSearch: false,
            searchParams: searchParams,
          });
          setHasInitialSearch(true);
        }
      } catch (err) {
        console.error("Initial load error:", err);
        setErrorVehicles(
          (err as Error).message || "Không thể tải danh sách xe ban đầu."
        );
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, [cityFromUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20  shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Danh sách xe
              </h1>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Lọc</span>
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24" data-filter-section>
              <VehicleFilter
                filters={filters}
                setFilters={setFilters}
                onSearchResults={handleSearchResults}
                autoSearch={!!cityFromUrl}
              />
            </div>
          </aside>

          {/* Vehicle List */}
          <main className="flex-1 min-w-0">
            <VehicleListing
              vehicles={vehicles}
              isLoading={isLoadingVehicles}
              error={errorVehicles}
              currentPage={currentPage}
              totalItems={paginationInfo.totalElements}
              pageSize={paginationInfo.size}
              onPageChange={handlePageChange}
            />
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        title="Bộ lọc tìm kiếm"
        placement="bottom"
        height="90%"
        open={showMobileFilter}
        onClose={() => setShowMobileFilter(false)}
        className="mobile-filter-drawer"
      >
        <VehicleFilter
          filters={filters}
          setFilters={setFilters}
          onSearchResults={handleSearchResults}
          isMobile={true}
          onClose={() => setShowMobileFilter(false)}
          autoSearch={!!cityFromUrl}
        />
      </Drawer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ListVehiclePage;
