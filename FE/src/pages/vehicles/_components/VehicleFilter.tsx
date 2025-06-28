"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Car,
  BikeIcon as Motorbike,
  Bike,
  MapPin,
  ChevronDown,
} from "lucide-react";
import type { VehicleFilters, Vehicle } from "@/types/vehicle"; // Import Vehicle
import {
  getProvinces,
  getDistrictsByProvinceCode,
  getWardsByDistrictCode,
} from "@/lib/vietnam-geo-data";
import { toast } from "react-toastify";
import { formatCurrency } from "@/lib/format-currency";
import { Slider } from "@/components/ui/Slider";
import { searchVehicles } from "@/apis/vehicle.api";

// Import dữ liệu hãng xe
import carBrandsData from "@/data/car-brands.json";
import MotorbikeBrandsData from "@/data/motorbike-brand.json";

interface VehicleFilterProps {
  filters: VehicleFilters;
  setFilters: Dispatch<SetStateAction<VehicleFilters>>;
  onApplyFilters: (
    vehicles: Vehicle[],
    isLoading: boolean,
    error: string | null
  ) => void; // Thêm prop mới
}

interface GeoUnit {
  code: string;
  name: string;
}

interface BrandOption {
  value: string;
  label: string;
}

const VehicleFilter: React.FC<VehicleFilterProps> = ({
  filters,
  setFilters,
  onApplyFilters,
}) => {
  const [provinces, setProvinces] = useState<GeoUnit[]>([]);
  const [districts, setDistricts] = useState<GeoUnit[]>([]);
  const [wards, setWards] = useState<GeoUnit[]>([]);
  const [currentBrands, setCurrentBrands] = useState<BrandOption[]>([]);

  // Hàm để cập nhật filters
  const handleFilterChange = (key: keyof VehicleFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Hàm xử lý khi nhấn nút "Áp dụng bộ lọc"
  const applyFilters = async () => {
    onApplyFilters([], true, null); // Bắt đầu tải, xóa dữ liệu cũ, đặt isLoading = true
    const requestBody: any = {};

    if (filters.vehicleType) {
      requestBody.vehicleTypes = [filters.vehicleType];
    }

    if (filters.city) {
      requestBody.addresses = [filters.city];
    }

    if (filters.hasDriver !== undefined) {
      requestBody.haveDriver = filters.hasDriver ? "YES" : "NO";
    }

    if (filters.shipToAddress !== undefined) {
      requestBody.shipToAddress = filters.shipToAddress ? "YES" : "NO";
    }

    if (filters.brand) {
      requestBody.brandId = filters.brand;
    }

    if (filters.seats) {
      requestBody.numberSeat = filters.seats;
    }

    if (filters.minPrice !== undefined) {
      requestBody.costFrom = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      requestBody.costTo = filters.maxPrice;
    }

    if (filters.maxRating === 4) {
      requestBody.ratingFiveStarsOnly = true;
    } else {
      requestBody.ratingFiveStarsOnly = false;
    }

    requestBody.page = 0;
    requestBody.size = 5;

    console.log("Đang gửi bộ lọc đến backend với body:", requestBody);

    try {
      const result = await searchVehicles({ body: requestBody });
      console.log("Dữ liệu từ backend:", result);
      toast.success(`Tìm kiếm thành công! Tìm thấy ${result.length} xe.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      onApplyFilters(result, false, null); // Truyền dữ liệu và trạng thái thành công
    } catch (error: any) {
      console.error("Lỗi khi gửi bộ lọc:", error);
      const errorMessage = error.message || "Lỗi không xác định.";
      toast.error(`Tìm kiếm thất bại: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      onApplyFilters([], false, errorMessage); // Truyền lỗi và trạng thái thất bại
    }
  };

  useEffect(() => {
    const loadProvinces = async () => {
      const data = await getProvinces();
      setProvinces(data);
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    if (filters.city) {
      const loadDistricts = async () => {
        const provinceCode = provinces.find(
          (p) => p.name === filters.city
        )?.code;
        if (provinceCode) {
          const data = await getDistrictsByProvinceCode(provinceCode);
          setDistricts(data);
        } else {
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
        const districtCode = districts.find(
          (d) => d.name === filters.district
        )?.code;
        if (districtCode) {
          const data = await getWardsByDistrictCode(districtCode);
          setWards(data);
        } else {
          setWards([]);
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [filters.district, districts]);

  useEffect(() => {
    if (filters.vehicleType === "CAR") {
      setCurrentBrands(carBrandsData);
    } else if (filters.vehicleType === "MOTORBIKE") {
      setCurrentBrands(MotorbikeBrandsData);
    } else {
      setCurrentBrands([]);
    }
    handleFilterChange("brand", undefined);
  }, [filters.vehicleType]);

  const sliderValue = [
    filters.minPrice !== undefined ? filters.minPrice : 0,
    filters.maxPrice !== undefined ? filters.maxPrice : 3000000,
  ];

  const isPriceFilterAny =
    filters.minPrice === 0 && filters.maxPrice === 3000000;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      {/* Loại xe */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Loại xe</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "Car"
                ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() =>
              handleFilterChange(
                "vehicleType",
                filters.vehicleType === "CAR" ? undefined : "CAR"
              )
            }
          >
            <Car className="mb-1 h-6 w-6" />
            <p className="text-sm">Ô tô</p>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "MOTORBIKE"
                ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() =>
              handleFilterChange(
                "vehicleType",
                filters.vehicleType === "MOTORBIKE" ? undefined : "MOTORBIKE"
              )
            }
          >
            <Motorbike className="mb-1 h-6 w-6" />
            <p className="text-sm">Xe máy</p>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "BICYCLE"
                ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() =>
              handleFilterChange(
                "vehicleType",
                filters.vehicleType === "BICYCLE" ? undefined : "BICYCLE"
              )
            }
          >
            <Bike className="mb-1 h-6 w-6" />
            <p className="text-sm">Xe đạp</p>
          </button>
        </div>
      </div>

      {/* Hãng xe - Chỉ hiển thị cho Ô tô và Xe máy (hoặc khi chưa chọn loại xe) */}
      {(filters.vehicleType === "CAR" ||
        filters.vehicleType === "MOTORBIKE") && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 dark:text-white">
            Hãng xe
          </h3>
          <select
            className="w-full p-2.5 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.brand || ""}
            onChange={(e) =>
              handleFilterChange("brand", e.target.value || undefined)
            }
          >
            <option value="" disabled hidden>
              Tất cả các hãng
            </option>
            {currentBrands.map((brand) => (
              <option key={brand.value} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Số chỗ ngồi - Chỉ hiển thị cho Ô tô (hoặc khi chưa chọn loại xe) */}
      {(filters.vehicleType === undefined || filters.vehicleType === "CAR") && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 dark:text-white">
            Số chỗ ngồi
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[4, 5, 7, 16].map((seat) => (
              <button
                key={seat}
                className={`p-2 border rounded-md text-center ${
                  filters.seats === seat
                    ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                }`}
                onClick={() =>
                  handleFilterChange(
                    "seats",
                    filters.seats === seat ? undefined : seat
                  )
                }
              >
                {seat} chỗ
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mức giá */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Mức giá</h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium dark:text-white">
            {isPriceFilterAny
              ? "Bất kì"
              : `${formatCurrency(filters.minPrice || 0)} - ${formatCurrency(
                  filters.maxPrice || 3000000
                )}`}
          </span>
          <button
            className="px-3 py-1 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            onClick={() => {
              handleFilterChange("minPrice", 0); // Đặt lại về giá trị mặc định
              handleFilterChange("maxPrice", 3000000); // Đặt lại về giá trị mặc định
            }}
          >
            Bất kì
          </button>
        </div>
        <Slider
          min={0}
          max={3000000}
          step={50000}
          value={sliderValue}
          onValueChange={(value) => {
            handleFilterChange("minPrice", value[0]);
            handleFilterChange("maxPrice", value[1]);
          }}
          className="w-full"
        />
      </div>

      {/* Khu vực chọn địa điểm */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Địa điểm</h3>
        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              className="w-full pl-10 pr-3 py-2.5 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={filters.city || ""}
              onChange={(e) => {
                handleFilterChange("city", e.target.value || undefined);
                handleFilterChange("district", undefined); // Reset district when city changes
                handleFilterChange("ward", undefined); // Reset ward when city changes
              }}
            >
              <option value="">Chọn thành phố</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.name}>
                  {province.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              className="w-full pl-10 pr-3 py-2.5 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={filters.district || ""}
              onChange={(e) => {
                handleFilterChange("district", e.target.value || undefined);
                handleFilterChange("ward", undefined); // Reset ward when district changes
              }}
              disabled={!filters.city || districts.length === 0} // Disable if no city or no districts
            >
              <option value="">Chọn quận/huyện</option>
              {districts.map((district) => (
                <option key={district.code} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              className="w-full pl-10 pr-3 py-2.5 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={filters.ward || ""}
              onChange={(e) =>
                handleFilterChange("ward", e.target.value || undefined)
              }
              disabled={!filters.district || wards.length === 0} // Disable if no district or no wards
            >
              <option value="">Chọn phường/xã</option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.name}>
                  {ward.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tùy chọn khác: 5 sao, có lái, giao hàng tận nơi */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Tùy chọn</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maxRating"
              checked={!!filters.maxRating}
              onChange={(e) =>
                handleFilterChange(
                  "maxRating",
                  e.target.checked ? 4 : undefined // Changed to 4 stars as per label
                )
              }
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maxRating" className="dark:text-white">
              Đánh giá 5 sao
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="homeDelivery"
              checked={!!filters.shipToAddress}
              onChange={(e) =>
                handleFilterChange("shipToAddress", e.target.checked)
              }
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="homeDelivery" className="dark:text-white">
              Giao xe tận nơi
            </label>
          </div>
          {/* Xe có lái - Chỉ hiển thị cho Ô tô và Xe máy (hoặc khi chưa chọn loại xe) */}
          {(filters.vehicleType === undefined ||
            filters.vehicleType === "CAR" ||
            filters.vehicleType === "MOTORBIKE") && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasDriver"
                checked={!!filters.hasDriver}
                onChange={(e) =>
                  handleFilterChange("hasDriver", e.target.checked)
                }
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasDriver" className="dark:text-white">
                Xe có lái
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Nút áp dụng */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
        onClick={applyFilters}
      >
        Tìm kiếm
      </button>

      {/* Nút xóa bộ lọc */}
      <button
        className="w-full mt-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() =>
          setFilters({
            vehicleType: undefined,
            brand: undefined,
            seats: undefined,
            maxRating: undefined,
            shipToAddress: false,
            hasDriver: false,
            city: undefined,
            district: undefined,
            ward: undefined,
            minPrice: 0,
            maxPrice: 3000000,
          })
        }
      >
        Xóa tùy chọn
      </button>
    </div>
  );
};

export default VehicleFilter;
