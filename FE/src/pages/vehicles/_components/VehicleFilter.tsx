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
// import { formatCurrency } from "@/lib/format-currency";
// import { Slider } from "@/components/ui/Slider";
import { searchVehicles } from "@/apis/vehicle.api";
import AdvancedSearch from "@/components/AdvancedSearch";

// Import types từ AdvancedSearch
interface FilterValues {
  priceRange: [number, number];
  carType: string;
  transmission: string;
  fuelType: string;
  features: string[];
}

import { DateRangePicker } from "@/components/antd";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// type RangeValue = [Dayjs | null, Dayjs | null] | null;

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

interface VehicleFilterProps {
  filters: VehicleFilters;
  setFilters: Dispatch<SetStateAction<VehicleFilters>>;
  onApplyFilters: (
    vehicles: Vehicle[],
    isLoading: boolean,
    error: string | null,
    paginationInfo?: PaginationInfo
  ) => void;
}

interface GeoUnit {
  code: string;
  name: string;
}

// interface BrandOption {
//   value: string;
//   label: string;
// }

const VehicleFilter: React.FC<VehicleFilterProps> = ({
  filters,
  setFilters,
  onApplyFilters,
}) => {
  const [provinces, setProvinces] = useState<GeoUnit[]>([]);
  const [districts, setDistricts] = useState<GeoUnit[]>([]);
  const [wards, setWards] = useState<GeoUnit[]>([]);

  // State để quản lý modal tìm kiếm nâng cao
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeVehicleType, setActiveVehicleType] = useState<
    "CAR" | "MOTORBIKE" | "BICYCLE"
  >("CAR");
  const [currentAdvancedFilters, setCurrentAdvancedFilters] = useState<
    Record<string, unknown>
  >({});

  const [pickupDateTime, setPickupDateTime] = useState<string>("");
  const [returnDateTime, setReturnDateTime] = useState<string>("");

  // Hàm xử lý khi chọn ngày giờ
  const handleDateChange: RangePickerProps["onChange"] = (values) => {
    if (values && values[0] && values[1]) {
      const [startDate, endDate] = values;

      // Cập nhật pickup và return time
      setPickupDateTime(startDate.format("YYYY-MM-DDTHH:mm"));
      setReturnDateTime(endDate.format("YYYY-MM-DDTHH:mm"));

      // Cập nhật filter
      handleFilterChange(
        "pickupDateTime",
        startDate.format("YYYY-MM-DDTHH:mm")
      );
      handleFilterChange("returnDateTime", endDate.format("YYYY-MM-DDTHH:mm"));
    } else {
      // Reset giá trị khi không chọn ngày
      setPickupDateTime("");
      setReturnDateTime("");
      handleFilterChange("pickupDateTime", undefined);
      handleFilterChange("returnDateTime", undefined);
    }
  };

  // Hàm kiểm tra giờ không được phép chọn
  const disabledRangeTime: RangePickerProps["disabledTime"] = (
    current,
    type
  ) => {
    if (!current) return {};

    const currentDate = dayjs();
    const isToday = current.isSame(currentDate, "day");
    const currentHour = currentDate.hour();

    // Mặc định giờ không khả dụng (sáng sớm và tối muộn)
    const defaultDisabledHours = [
      0, 1, 2, 3, 4, 5, 6, 17, 18, 19, 20, 21, 22, 23,
    ];

    // Nếu là ngày hôm nay, thêm các giờ đã qua vào danh sách giờ bị disable
    if (isToday) {
      // Thời điểm hiện tại + 1 giờ (buffer time để có thời gian chuẩn bị)
      const disabledPastHours = Array.from(
        { length: currentHour + 1 },
        (_, i) => i
      );

      // Gộp với danh sách giờ mặc định bị disable
      const todayDisabledHours = [
        ...new Set([...defaultDisabledHours, ...disabledPastHours]),
      ];

      if (type === "start") {
        return {
          disabledHours: () => todayDisabledHours,
          disabledMinutes: (selectedHour) => {
            // Nếu giờ được chọn là giờ hiện tại, disable những phút đã qua
            if (selectedHour === currentHour + 1) {
              return Array.from({ length: currentDate.minute() }, (_, i) => i);
            }
            return [];
          },
        };
      }
    }

    return {
      disabledHours: () => defaultDisabledHours,
    };
  };

  // Hàm kiểm tra ngày không được phép chọn (chỉ cho phép từ hôm nay trở đi)
  const disabledDate = (current: Dayjs | null): boolean => {
    if (!current) return false;

    const today = dayjs().startOf("day");
    // Chỉ disable các ngày trong quá khứ
    return current.isBefore(today);
  };

  // Hàm để cập nhật filters
  const handleFilterChange = (key: keyof VehicleFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Hàm xử lý khi nhấn nút "Áp dụng bộ lọc"
  const applyFilters = async () => {
    onApplyFilters([], true, null); // Bắt đầu tải, xóa dữ liệu cũ, đặt isLoading = true
    const requestBody: Record<string, unknown> = {};

    if (filters.vehicleType) {
      requestBody.vehicleTypes = [filters.vehicleType];
    }

    if (filters.city) {
      requestBody.addresses = [filters.city];
    }

    // Chỉ gửi hasDriver khi user thực sự chọn (true)
    if (filters.hasDriver === true) {
      requestBody.haveDriver = "YES";
    }

    // Chỉ gửi shipToAddress khi user thực sự chọn (true)
    if (filters.shipToAddress === true) {
      requestBody.shipToAddress = "YES";
    }

    if (filters.minPrice !== undefined) {
      requestBody.costFrom = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      requestBody.costTo = filters.maxPrice;
    }

    if (filters.maxRating === 5) {
      requestBody.ratingFiveStarsOnly = true;
    } else {
      requestBody.ratingFiveStarsOnly = false;
    }

    if (pickupDateTime) {
      requestBody.timeFrom = pickupDateTime;
    }

    if (returnDateTime) {
      requestBody.timeTo = returnDateTime;
    }

    // requestBody.page = 0;
    // requestBody.size = 12; // Hiển thị 12 xe mỗi trang

    console.log("Đang gửi bộ lọc đến backend với body:", requestBody);

    try {
      console.log("Calling searchVehicles with requestBody:", requestBody);
      const result = await searchVehicles({ body: requestBody });
      console.log("Dữ liệu từ backend:", result);

      // Backend trả về object có vehicles và pagination info
      const vehicles = result.content || result.vehicles || [];
      const paginationInfo = {
        totalItems: result.totalElements || result.total || vehicles.length,
        totalPages: result.totalPages || 1,
        currentPage: result.number || 0, // Backend dùng 0-based index
        size: result.size || 12,
      };

      toast.success(
        `Tìm kiếm thành công! Tìm thấy ${paginationInfo.totalItems} xe.`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
      );
      onApplyFilters(vehicles, false, null, paginationInfo);
    } catch (error) {
      console.error("Lỗi khi gửi bộ lọc:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định.";
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

  // Hàm để mở modal tìm kiếm nâng cao
  const openAdvancedSearch = (type: "CAR" | "MOTORBIKE" | "BICYCLE") => {
    setActiveVehicleType(type);
    setShowAdvancedSearch(true);
  };

  // Hàm xử lý khi áp dụng bộ lọc nâng cao
  const handleAdvancedSearch = async (advancedFilters: FilterValues) => {
    try {
      // Bắt đầu tải, xóa dữ liệu cũ, đặt isLoading = true
      onApplyFilters([], true, null);

      const requestBody: Record<string, unknown> = {
        ...currentAdvancedFilters,
        vehicleTypes: [activeVehicleType],
        page: 0,
        size: 10,
      };

      // Xử lý giá
      if (advancedFilters.priceRange) {
        const priceRange = advancedFilters.priceRange as [number, number];
        requestBody.costFrom = priceRange[0];
        requestBody.costTo = priceRange[1];
      }

      // Thêm các bộ lọc riêng cho từng loại xe
      if (activeVehicleType === "CAR") {
        if (advancedFilters.carType && advancedFilters.carType !== "ALL") {
          requestBody.carType = advancedFilters.carType;
        }
        if (advancedFilters.transmission) {
          requestBody.transmission = advancedFilters.transmission;
        }
        if (advancedFilters.fuelType) {
          requestBody.fuelType = advancedFilters.fuelType;
        }
      } else if (activeVehicleType === "MOTORBIKE") {
        if (advancedFilters.transmission) {
          requestBody.motorbikeType = advancedFilters.transmission;
        }
        if (advancedFilters.fuelType) {
          requestBody.fuelType = advancedFilters.fuelType;
        }
      }

      // Xử lý tính năng
      if (
        advancedFilters.features &&
        Array.isArray(advancedFilters.features) &&
        advancedFilters.features.length > 0
      ) {
        requestBody.features = advancedFilters.features;
      }

      // Lưu lại bộ lọc hiện tại
      setCurrentAdvancedFilters(requestBody);

      console.log("Đang gửi request tìm kiếm nâng cao:", requestBody);

      // Gọi API tìm kiếm
      const result = await searchVehicles({ body: requestBody });
      console.log("Kết quả tìm kiếm nâng cao:", result);

      // Backend trả về object có vehicles và pagination info
      const vehicles = result.content || result.vehicles || [];
      const paginationInfo = {
        totalItems: result.totalElements || result.total || vehicles.length,
        totalPages: result.totalPages || 1,
        currentPage: result.number || 0,
        size: result.size || 12,
      };

      // Cập nhật kết quả
      onApplyFilters(vehicles, false, null, paginationInfo);

      // Đóng modal
      setShowAdvancedSearch(false);
    } catch (error) {
      console.error("Lỗi khi áp dụng bộ lọc nâng cao:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Không thể tìm kiếm xe";

      // Truyền lỗi về component cha
      onApplyFilters([], false, errorMessage);

      toast.error(`Tìm kiếm thất bại: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  // const sliderValue = [
  //   filters.minPrice !== undefined ? filters.minPrice : 0,
  //   filters.maxPrice !== undefined ? filters.maxPrice : 3000000,
  // ];

  // const isPriceFilterAny =
  //   filters.minPrice === 0 && filters.maxPrice === 3000000;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      {/* Loại xe */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Loại xe</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "CAR"
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

      {/* Mức giá */}
      {/* <div className="mb-6">
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
      </div> */}

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
      {/* <div className="mb-6">
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
          </div> */}
      {/* Xe có lái - Chỉ hiển thị cho Ô tô và Xe máy (hoặc khi chưa chọn loại xe) */}
      {/* {(filters.vehicleType === undefined ||
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
      </div> */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">
          Thời gian thuê
        </h3>
        <div className="mt-4 w-full">
          <DateRangePicker
            showTime={{
              format: "HH:mm",
              minuteStep: 10,
            }}
            format="DD-MM-YYYY HH:mm"
            disabledTime={disabledRangeTime}
            disabledDate={disabledDate}
            className="w-full"
            onChange={handleDateChange}
            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
          />
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

      {/* Nút tìm kiếm nâng cao */}
      <button
        onClick={() =>
          openAdvancedSearch(
            filters.vehicleType === "CAR"
              ? "CAR"
              : filters.vehicleType === "MOTORBIKE"
              ? "MOTORBIKE"
              : filters.vehicleType === "BICYCLE"
              ? "BICYCLE"
              : "CAR"
          )
        }
        className="w-full mt-4 border-2 border-blue-500 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center font-medium group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Tìm kiếm nâng cao
      </button>

      {/* Modal tìm kiếm nâng cao */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out"
            onClick={() => setShowAdvancedSearch(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[101] m-4 transform transition-all duration-300 ease-in-out opacity-100 scale-100 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Tìm kiếm nâng cao</h2>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => setActiveVehicleType("CAR")}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center font-medium transition-all ${
                    activeVehicleType === "CAR"
                      ? "bg-blue-100 text-blue-700 border border-blue-500 shadow-sm"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Car className="w-5 h-5 mr-2" />Ô tô
                </button>
                <button
                  onClick={() => setActiveVehicleType("MOTORBIKE")}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center font-medium transition-all ${
                    activeVehicleType === "MOTORBIKE"
                      ? "bg-blue-100 text-blue-700 border border-blue-500 shadow-sm"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Motorbike className="w-5 h-5 mr-2" />
                  Xe máy
                </button>
                <button
                  onClick={() => setActiveVehicleType("BICYCLE")}
                  className={`flex-1 py-3 rounded-lg flex items-center justify-center font-medium transition-all ${
                    activeVehicleType === "BICYCLE"
                      ? "bg-blue-100 text-blue-700 border border-blue-500 shadow-sm"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Bike className="w-5 h-5 mr-2" />
                  Xe đạp
                </button>
              </div>

              <AdvancedSearch
                vehicleType={activeVehicleType}
                onChange={handleAdvancedSearch}
                className="mt-3"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleFilter;
