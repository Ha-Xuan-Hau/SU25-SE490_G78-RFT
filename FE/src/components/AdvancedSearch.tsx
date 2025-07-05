"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "antd";
import { cn } from "@/lib/utils";
// Removed select import as we're using checkboxes now
import { Slider } from "@/components/ui/Slider";
import { formatCurrency } from "@/lib/format-currency";
import { Car, BikeIcon as Motorbike, Bike } from "lucide-react";

// Define types for our component
interface FilterValues {
  priceRange: [number, number];
  carType: string;
  transmission: string;
  fuelType: string;
  features: string[];
}

interface AdvancedSearchProps {
  vehicleType: "CAR" | "MOTORBIKE" | "BICYCLE";
  onChange: (filters: FilterValues) => void;
  className?: string;
}

// Car type options
const CAR_TYPES = [
  { value: "MINI", label: "4 chỗ (Mini)" },
  { value: "SEDAN", label: "4 chỗ (Sedan)" },
  { value: "CUV", label: "5 chỗ (CUV Gầm cao)" },
  { value: "SUV", label: "7 chỗ (SUV gầm cao)" },
  { value: "MPV", label: "7 chỗ (MPV gầm thấp)" },
  { value: "PICKUP", label: "Bán tải" },
  { value: "MINIVAN", label: "Minivan" },
];

// Transmission options
const CAR_TRANSMISSIONS = [
  { value: "AUTOMATIC", label: "Tự động" },
  { value: "MANUAL", label: "Số sàn" },
];

const MOTORBIKE_TRANSMISSIONS = [
  { value: "GA", label: "Xe ga" },
  { value: "SO", label: "Xe số" },
  { value: "CON", label: "Xe côn" },
];

// Fuel options
const FUEL_TYPES = [
  { value: "GASOLINE", label: "Xăng" },
  { value: "DIESEL", label: "Dầu diesel" },
  { value: "ELECTRIC", label: "Điện" },
  { value: "HYBRID", label: "Hybrid" },
];

// Features for each vehicle type
const CAR_FEATURES = [
  { value: "GPS", label: "GPS" },
  { value: "BLUETOOTH", label: "Bluetooth" },
  { value: "BACKUP_CAMERA", label: "Camera lùi" },
  { value: "SUNROOF", label: "Cửa sổ trời" },
  { value: "CHILD_SEAT", label: "Ghế trẻ em" },
  { value: "USB", label: "Cổng USB" },
];

const MOTORBIKE_FEATURES = [
  { value: "HELMET", label: "Mũ bảo hiểm" },
  { value: "RAINCOAT", label: "Áo mưa" },
  { value: "REPAIR_KIT", label: "Bộ dụng cụ sửa chữa" },
  { value: "PHONE_HOLDER", label: "Giá đỡ điện thoại" },
  { value: "LOCK", label: "Khóa chống trộm" },
  { value: "GLOVES", label: "Găng tay" },
];

const BICYCLE_FEATURES = [
  { value: "HELMET", label: "Mũ bảo hiểm" },
  { value: "BASKET", label: "Giỏ đựng đồ" },
  { value: "LIGHT", label: "Đèn" },
  { value: "LOCK", label: "Khóa" },
  { value: "BELL", label: "Chuông" },
  { value: "GPS", label: "GPS" },
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  vehicleType,
  onChange,
  className,
}) => {
  // State for all possible filters
  const [filters, setFilters] = useState<FilterValues>({
    priceRange: [0, 2000000] as [number, number], // Default price range in VND
    carType: "ALL", // For car only, use "ALL" instead of empty string
    transmission: "", // Different options per vehicle type
    fuelType: "", // For car and motorbike
    features: [], // Different options per vehicle type - this remains as array since multiple features can be selected
  });

  // Không tự động gọi onChange khi filter thay đổi
  // Thay vào đó, chỉ gọi khi người dùng nhấn nút Apply

  // Handle price range change
  const handlePriceChange = (value: [number, number]) => {
    setFilters({ ...filters, priceRange: value });
  };

  // Handle feature checkbox changes is now done inline for each checkbox

  // Handle radio button change for single-select options
  const handleSelectChange = (
    name: keyof Omit<FilterValues, "priceRange" | "features">,
    value: string
  ) => {
    setFilters({ ...filters, [name]: value });
  };

  // Reset filters when vehicle type changes
  useEffect(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      carType: "ALL", // Use "ALL" instead of empty string for carType
      transmission: "",
      fuelType: "",
      features: [],
    }));
  }, [vehicleType]);

  // Return the appropriate filter UI based on vehicle type
  const renderFiltersByVehicleType = () => {
    switch (vehicleType) {
      case "CAR":
        return (
          <>
            {/* Car Type Filter */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Loại xe</h4>

              <div className="flex mb-1">
                <div className="flex items-center mr-4">
                  <Checkbox
                    checked={filters.carType === "ALL"}
                    onChange={() => handleSelectChange("carType", "ALL")}
                  />
                  <span className="ml-2">Tất cả</span>
                </div>
              </div>

              {/* Display car types in two columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {CAR_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      checked={filters.carType === type.value}
                      onChange={() => handleSelectChange("carType", type.value)}
                    />
                    <span className="ml-2">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmission Filter */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Hộp số</h4>

              <div className="flex mb-1">
                <div className="flex items-center">
                  <Checkbox
                    checked={filters.transmission === ""}
                    onChange={() => handleSelectChange("transmission", "")}
                  />
                  <span className="ml-2">Tất cả</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {CAR_TRANSMISSIONS.map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      checked={filters.transmission === type.value}
                      onChange={() =>
                        handleSelectChange("transmission", type.value)
                      }
                    />
                    <span className="ml-2">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Type Filter */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Nhiên liệu</h4>

              <div className="flex mb-1">
                <div className="flex items-center">
                  <Checkbox
                    checked={filters.fuelType === ""}
                    onChange={() => handleSelectChange("fuelType", "")}
                  />
                  <span className="ml-2">Tất cả</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {FUEL_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      checked={filters.fuelType === type.value}
                      onChange={() =>
                        handleSelectChange("fuelType", type.value)
                      }
                    />
                    <span className="ml-2">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Filter */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Tính năng</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {CAR_FEATURES.map((feature) => (
                  <div key={feature.value} className="flex items-center">
                    <Checkbox
                      checked={filters.features.includes(feature.value)}
                      onChange={(e) => {
                        const newFeatures = e.target.checked
                          ? [...filters.features, feature.value]
                          : filters.features.filter((f) => f !== feature.value);
                        setFilters({ ...filters, features: newFeatures });
                      }}
                    />
                    <span className="ml-2">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case "MOTORBIKE":
        return (
          <>
            {/* Transmission Filter for Motorbike */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Loại xe</h4>

              <div className="flex mb-1">
                <div className="flex items-center">
                  <Checkbox
                    checked={filters.transmission === ""}
                    onChange={() => handleSelectChange("transmission", "")}
                  />
                  <span className="ml-2">Tất cả</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {MOTORBIKE_TRANSMISSIONS.map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      checked={filters.transmission === type.value}
                      onChange={() =>
                        handleSelectChange("transmission", type.value)
                      }
                    />
                    <span className="ml-2">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Type Filter for Motorbike */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Nhiên liệu</h4>

              <div className="flex mb-1">
                <div className="flex items-center">
                  <Checkbox
                    checked={filters.fuelType === ""}
                    onChange={() => handleSelectChange("fuelType", "")}
                  />
                  <span className="ml-2">Tất cả</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {/* Filter out diesel option for motorbikes */}
                {FUEL_TYPES.filter(
                  (type) => type.value !== "DIESEL" && type.value !== "HYBRID"
                ).map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      checked={filters.fuelType === type.value}
                      onChange={() =>
                        handleSelectChange("fuelType", type.value)
                      }
                    />
                    <span className="ml-2">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Filter for Motorbike */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Tính năng</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {MOTORBIKE_FEATURES.map((feature) => (
                  <div key={feature.value} className="flex items-center">
                    <Checkbox
                      checked={filters.features.includes(feature.value)}
                      onChange={(e) => {
                        const newFeatures = e.target.checked
                          ? [...filters.features, feature.value]
                          : filters.features.filter((f) => f !== feature.value);
                        setFilters({ ...filters, features: newFeatures });
                      }}
                    />
                    <span className="ml-2">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case "BICYCLE":
        return (
          <>
            {/* Features Filter for Bicycle */}
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2">Tiện ích</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {BICYCLE_FEATURES.map((feature) => (
                  <div key={feature.value} className="flex items-center">
                    <Checkbox
                      checked={filters.features.includes(feature.value)}
                      onChange={(e) => {
                        const newFeatures = e.target.checked
                          ? [...filters.features, feature.value]
                          : filters.features.filter((f) => f !== feature.value);
                        setFilters({ ...filters, features: newFeatures });
                      }}
                    />
                    <span className="ml-2">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Get the icon and label for the current vehicle type
  const getVehicleTypeIcon = () => {
    switch (vehicleType) {
      case "CAR":
        return <Car className="mr-2" size={20} />;
      case "MOTORBIKE":
        return <Motorbike className="mr-2" size={20} />;
      case "BICYCLE":
        return <Bike className="mr-2" size={20} />;
      default:
        return null;
    }
  };

  const getVehicleTypeLabel = () => {
    switch (vehicleType) {
      case "CAR":
        return "Xe ô tô";
      case "MOTORBIKE":
        return "Xe máy";
      case "BICYCLE":
        return "Xe đạp";
      default:
        return "";
    }
  };

  // Thay thế phần return ở cuối component
  return (
    <div className={cn("bg-white", className)}>
      <div className="flex items-center mb-5">
        {getVehicleTypeIcon()}
        <h3 className="text-lg font-semibold">
          Bộ lọc nâng cao - {getVehicleTypeLabel()}
        </h3>
      </div>

      {/* Price Range Filter - common for all vehicle types */}
      <div className="mb-5">
        <h4 className="text-sm font-medium mb-2">Giá thuê / ngày</h4>
        <div>
          <Slider
            defaultValue={[0, 500000]}
            min={0}
            max={3000000}
            step={50000}
            value={filters.priceRange}
            onValueChange={handlePriceChange}
            className="my-2"
          />
          <div className="flex justify-between mt-3 text-sm">
            <span>{formatCurrency(filters.priceRange[0])}</span>
            <span>{formatCurrency(filters.priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Render specific filters based on vehicle type */}
      {renderFiltersByVehicleType()}

      {/* Loại bỏ nút Apply vì đã có trong modal footer */}
    </div>
  );
};

export default AdvancedSearch;
