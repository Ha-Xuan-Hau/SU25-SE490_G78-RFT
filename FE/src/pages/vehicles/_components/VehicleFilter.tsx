// @/app/vehicles/_components/VehicleFilter.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Car,
  BikeIcon as Motorbike,
  Bike,
  MapPin,
  Search,
  RotateCcw,
  Settings,
} from "lucide-react";
import type { VehicleFilters, Vehicle } from "@/types/vehicle";
import {
  getProvinces,
  getDistrictsByProvinceCode,
  getWardsByDistrictCode,
} from "@/lib/vietnam-geo-data";
import { toast } from "react-toastify";
import AdvancedSearchModal from "@/components/AdvancedSearchModal";
import { DateRangePicker } from "@/components/antd";
import dayjs from "@/utils/dayjs";
import { Dayjs } from "@/utils/dayjs";
import { RangePickerProps } from "antd/es/date-picker";

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

interface VehicleFilterProps {
  filters: VehicleFilters;
  setFilters: Dispatch<SetStateAction<VehicleFilters>>;
  onSearchResults: (
    vehicles: Vehicle[],
    isLoading: boolean,
    error: string | null,
    paginationInfo?: PaginationInfo,
    isAdvanced?: boolean,
    searchParams?: Record<string, unknown>
  ) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface GeoUnit {
  code: string;
  name: string;
}

type VehicleType = "CAR" | "MOTORBIKE" | "BICYCLE";

const VehicleFilter: React.FC<VehicleFilterProps> = ({
  filters,
  setFilters,
  onSearchResults,
  isMobile = false,
  onClose,
}) => {
  const [provinces, setProvinces] = useState<GeoUnit[]>([]);
  const [districts, setDistricts] = useState<GeoUnit[]>([]);
  const [wards, setWards] = useState<GeoUnit[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pickupDateTime, setPickupDateTime] = useState<string>("");
  const [returnDateTime, setReturnDateTime] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  const handleFilterChange = useCallback(
    (key: keyof VehicleFilters, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters]
  );

  const handleDateChange: RangePickerProps["onChange"] = useCallback(
    (values: any) => {
      if (values && values[0] && values[1]) {
        const [startDate, endDate] = values;
        const pickup = startDate.format("YYYY-MM-DDTHH:mm:ss");
        const returnTime = endDate.format("YYYY-MM-DDTHH:mm:ss");

        setPickupDateTime(pickup);
        setReturnDateTime(returnTime);
        setDateRange([startDate, endDate]);
        handleFilterChange("pickupDateTime", pickup);
        handleFilterChange("returnDateTime", returnTime);
      } else {
        setPickupDateTime("");
        setReturnDateTime("");
        setDateRange([null, null]);
        handleFilterChange("pickupDateTime", undefined);
        handleFilterChange("returnDateTime", undefined);
      }
    },
    [handleFilterChange]
  );

  const disabledDate = useCallback((current: Dayjs | null): boolean => {
    if (!current) return false;
    return current.isBefore(dayjs().startOf("day"));
  }, []);

  const disabledRangeTime: RangePickerProps["disabledTime"] = useCallback(
    (current: any, type: string) => {
      if (!current) return {};

      const now = dayjs();
      const isToday = current.isSame(now, "day");
      const currentHour = now.hour();

      const businessHours = Array.from({ length: 24 }, (_, i) => i).filter(
        (hour) => hour < 7 || hour > 22
      );

      if (isToday && type === "start") {
        const disabledHours = [
          ...businessHours,
          ...Array.from({ length: currentHour + 1 }, (_, i) => i),
        ];
        return {
          disabledHours: () => [...new Set(disabledHours)],
          disabledMinutes: (selectedHour: number) => {
            if (selectedHour === currentHour + 1) {
              return Array.from({ length: now.minute() }, (_, i) => i);
            }
            return [];
          },
        };
      }

      return {
        disabledHours: () => businessHours,
      };
    },
    []
  );

  const handleBasicSearch = async () => {
    if (isSearching) return;

    setIsSearching(true);
    onSearchResults([], true, null);

    try {
      const { basicSearchVehicles } = await import("@/apis/vehicle.api");

      const addressParts = [
        filters.ward,
        filters.district,
        filters.city,
      ].filter(Boolean);
      const fullAddress =
        addressParts.length > 0 ? addressParts.join(", ") : undefined;

      const searchParams = {
        address: fullAddress,
        vehicleType: filters.vehicleType,
        pickupDateTime: pickupDateTime || undefined,
        returnDateTime: returnDateTime || undefined,
        page: 0,
        size: 12,
      };

      console.log("Basic search params:", searchParams);

      const result = await basicSearchVehicles(searchParams);

      const paginationInfo: PaginationInfo = {
        totalElements: result.totalElements,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        size: result.size,
      };

      onSearchResults(
        result.content,
        false,
        null,
        paginationInfo,
        false,
        searchParams
      );

      toast.success(`Tìm thấy ${result.totalElements} xe phù hợp!`);

      if (isMobile && onClose) {
        onClose();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi tìm kiếm";
      onSearchResults([], false, errorMessage);
      toast.error(`Tìm kiếm thất bại: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = async (
    advancedFilters: Record<string, unknown>
  ) => {
    if (isSearching) return;

    setIsSearching(true);
    onSearchResults([], true, null);

    try {
      const { advancedSearchVehicles } = await import("@/apis/vehicle.api");

      // Build addresses array from current location filters
      const addresses = [];
      if (filters.city) {
        const address = [filters.ward, filters.district, filters.city]
          .filter(Boolean)
          .join(", ");
        addresses.push(address);
      }

      // Merge with advanced filters and add addresses
      const searchParams = {
        ...advancedFilters,
        addresses: addresses.length > 0 ? addresses : undefined,
        pickupDateTime: pickupDateTime || undefined,
        returnDateTime: returnDateTime || undefined,
        page: 0,
        size: 12,
      };

      console.log("Advanced search params being sent:", searchParams);

      const result = await advancedSearchVehicles(searchParams);

      const paginationInfo: PaginationInfo = {
        totalElements: result.totalElements,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        size: result.size,
      };

      onSearchResults(
        result.content,
        false,
        null,
        paginationInfo,
        true,
        searchParams
      );

      toast.success(`Tìm thấy ${result.totalElements} xe phù hợp!`);

      if (isMobile && onClose) {
        onClose();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi tìm kiếm nâng cao";
      onSearchResults([], false, errorMessage);
      toast.error(`Tìm kiếm nâng cao thất bại: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  // const resetFilters = useCallback(() => {
  //   setFilters({
  //     vehicleType: undefined,
  //     maxRating: undefined,
  //     shipToAddress: false,
  //     hasDriver: false,
  //     city: undefined,
  //     district: undefined,
  //     ward: undefined,
  //     minPrice: 0,
  //     maxPrice: 3000000,
  //   });
  //   setPickupDateTime("");
  //   setReturnDateTime("");
  //   setDateRange([null, null]);
  //   onSearchResults([], false, null, undefined, false, {});
  // }, [setFilters, onSearchResults]);
  const resetFilters = useCallback(() => {
    window.location.reload();
  }, []);

  // Load geographic data
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Load provinces error:", error);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    if (filters.city) {
      const loadDistricts = async () => {
        try {
          const provinceCode = provinces.find(
            (p) => p.name === filters.city
          )?.code;
          if (provinceCode) {
            const data = await getDistrictsByProvinceCode(provinceCode);
            setDistricts(data);
          }
        } catch (error) {
          setDistricts([]);
        }
      };
      loadDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [filters.city, provinces]);

  useEffect(() => {
    if (filters.district) {
      const loadWards = async () => {
        try {
          const districtCode = districts.find(
            (d) => d.name === filters.district
          )?.code;
          if (districtCode) {
            const data = await getWardsByDistrictCode(districtCode);
            setWards(data);
          }
        } catch (error) {
          setWards([]);
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [filters.district, districts]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
          isMobile ? "p-4" : "p-6"
        }`}
      >
        {/* Header */}
        {!isMobile && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Bộ lọc tìm kiếm
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tìm xe phù hợp với nhu cầu của bạn
            </p>
          </div>
        )}

        {/* Vehicle Type */}
        <div className={isMobile ? "mb-4" : "mb-6"}>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Loại xe
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: "CAR" as VehicleType, icon: Car, label: "Ô tô" },
              {
                type: "MOTORBIKE" as VehicleType,
                icon: Motorbike,
                label: "Xe máy",
              },
              { type: "BICYCLE" as VehicleType, icon: Bike, label: "Xe đạp" },
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                className={`flex flex-col items-center justify-center ${
                  isMobile ? "p-2" : "p-3"
                } border-2 rounded-lg text-xs transition-all ${
                  filters.vehicleType === type
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() =>
                  handleFilterChange(
                    "vehicleType",
                    filters.vehicleType === type ? undefined : type
                  )
                }
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className={isMobile ? "mb-4" : "mb-6"}>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Địa điểm
          </label>
          <div className="space-y-3">
            {[
              {
                key: "city" as const,
                placeholder: "Chọn tỉnh/thành phố",
                options: provinces,
                disabled: false,
              },
              {
                key: "district" as const,
                placeholder: "Chọn quận/huyện",
                options: districts,
                disabled: !filters.city,
              },
              {
                key: "ward" as const,
                placeholder: "Chọn phường/xã",
                options: wards,
                disabled: !filters.district,
              },
            ].map(({ key, placeholder, options, disabled }) => (
              <div key={key} className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm transition-colors ${
                    disabled
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  value={(filters[key] as string) || ""}
                  onChange={(e) => {
                    handleFilterChange(key, e.target.value || undefined);
                    if (key === "city") {
                      handleFilterChange("district", undefined);
                      handleFilterChange("ward", undefined);
                    } else if (key === "district") {
                      handleFilterChange("ward", undefined);
                    }
                  }}
                  disabled={disabled}
                >
                  <option value="">{placeholder}</option>
                  {options.map((option) => (
                    <option key={option.code} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className={isMobile ? "mb-4" : "mb-6"}>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Thời gian thuê
          </label>
          <DateRangePicker
            value={dateRange}
            showTime={{
              format: "HH:mm",
              minuteStep: 15,
            }}
            format={isMobile ? "DD/MM HH:mm" : "DD/MM/YYYY HH:mm"}
            disabledTime={disabledRangeTime}
            disabledDate={disabledDate}
            className="w-full"
            onChange={handleDateChange}
            placeholder={["Ngày nhận xe", "Ngày trả xe"]}
            size={isMobile ? "middle" : "large"}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            onClick={handleBasicSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Đang tìm kiếm...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="border border-blue-500 text-blue-600 hover:bg-blue-50 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
              onClick={() => setShowAdvancedSearch(true)}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Nâng cao
            </button>

            <button
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
              onClick={resetFilters}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
        currentVehicleType={filters.vehicleType as VehicleType | undefined}
      />
    </div>
  );
};

export default VehicleFilter;
