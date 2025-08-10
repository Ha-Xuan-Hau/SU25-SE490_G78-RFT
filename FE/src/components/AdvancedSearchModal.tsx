// @/components/AdvancedSearchModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Car, BikeIcon as Motorbike, Bike, Search } from "lucide-react";
import { Checkbox, Slider, Drawer } from "antd";
import { formatCurrency } from "@/lib/format-currency";
import Portal from "@/components/ui/Portal";

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: Record<string, unknown>) => void;
  currentVehicleType?: "CAR" | "MOTORBIKE" | "BICYCLE";
}

interface FilterValues {
  priceRange: [number, number];
  carType: string;
  transmission: string;
  fuelType: string;
  features: string[];
  hasDriver: boolean;
  shipToAddress: boolean;
  ratingFiveStarsOnly: boolean;
  numberSeat: number | undefined;
}

const CAR_TYPES = [
  { value: "MINI", label: "4 chỗ (Mini)", seats: 4 },
  { value: "SEDAN", label: "4 chỗ (Sedan)", seats: 4 },
  { value: "CUV", label: "5 chỗ (CUV)", seats: 5 },
  { value: "SUV", label: "7 chỗ (SUV)", seats: 7 },
  { value: "MPV", label: "7 chỗ (MPV)", seats: 7 },
  { value: "PICKUP", label: "Bán tải", seats: 4 },
];

const CAR_TRANSMISSIONS = [
  { value: "AUTOMATIC", label: "Tự động" },
  { value: "MANUAL", label: "Số sàn" },
];

const MOTORBIKE_TRANSMISSIONS = [
  { value: "AUTOMATIC", label: "Xe ga" },
  { value: "MANUAL", label: "Xe số" },
  { value: "CLUTCH", label: "Xe côn" },
];

const FUEL_TYPES = [
  { value: "GASOLINE", label: "Xăng" },
  { value: "DIESEL", label: "Dầu diesel" },
  { value: "ELECTRIC", label: "Điện" },
];

// THÊM FEATURES CHO TỪNG LOẠI XE
const CAR_FEATURES = [
  { label: "GPS", value: "GPS" },
  { label: "Bluetooth", value: "Bluetooth" },
  { label: "Điều hòa khí", value: "Air Conditioning" },
  { label: "Ghế da", value: "Leather Seats" },
  { label: "Cảm biến đỗ xe", value: "Parking Sensors" },
  { label: "Camera hành trình", value: "Backup Camera" },
  { label: "Kính chống nắng", value: "Sunroof" },
  { label: "Ghế sưởi", value: "Heated Seats" },
  { label: "Hệ thống âm thanh cao cấp", value: "Premium Audio" },
  { label: "Cửa sổ trời", value: "Panoramic Roof" },
  { label: "Hệ thống khởi động từ xa", value: "Remote Start" },
  { label: "Cảnh báo điểm mù", value: "Blind Spot Monitor" },
  { label: "Cruise Control", value: "Cruise Control" },
  { label: "Hệ thống phanh ABS", value: "ABS Braking" },
  { label: "Cảm biến áp suất lốp", value: "TPMS" },
  { label: "Camera lùi", value: "Back Camera" },
  { label: "Khe cắm USB", value: "USB Port" },
  { label: "Màn hình DVD", value: "DVD Screen" },
  { label: "Túi khí an toàn", value: "Safety Airbag" },
  { label: "Cảnh báo tốc độ", value: "Speed Alert" },
];

const MOTORBIKE_FEATURES = [
  { label: "GPS", value: "GPS" },
  { label: "Bluetooth", value: "Bluetooth" },
  { label: "Khóa từ xa", value: "Remote Lock" },
  { label: "Báo động chống trộm", value: "Anti-theft Alarm" },
  { label: "Đèn LED", value: "LED Lights" },
  { label: "Cốp xe", value: "Storage Box" },
  { label: "Phanh ABS", value: "ABS Braking" },
  { label: "Khởi động điện", value: "Electric Start" },
  { label: "Sạc điện thoại USB", value: "USB Charging" },
  { label: "Đồng hồ kỹ thuật số", value: "Digital Dashboard" },
  { label: "Hệ thống định vị", value: "GPS Tracking" },
  { label: "Kính chắn gió", value: "Windshield" },
  { label: "Yên xe êm ái", value: "Comfort Seat" },
  { label: "Hệ thống chống trượt", value: "Traction Control" },
  { label: "Hệ thống treo cải tiến", value: "Advanced Suspension" },
  { label: "Khóa bánh trước", value: "Front Wheel Lock" },
  { label: "Gác chân cho người ngồi sau", value: "Passenger Footrest" },
  { label: "Lốp không săm", value: "Tubeless Tires" },
  { label: "Khóa cổ", value: "Steering Lock" },
  { label: "Chống nghiêng tự động", value: "Auto Side Stand" },
  { label: "Hệ thống tiết kiệm nhiên liệu", value: "Fuel-saving System" },
  { label: "Hệ thống làm mát", value: "Cooling System" },
];

const BICYCLE_FEATURES = [
  { label: "Đèn LED", value: "LED Lights" },
  { label: "Khóa chống trộm", value: "Anti-theft Lock" },
  { label: "Giỏ xe", value: "Basket" },
  { label: "Baga sau", value: "Rear Rack" },
  { label: "Chuông xe", value: "Bell" },
  { label: "Phanh đĩa", value: "Disc Brake" },
  { label: "Bánh xe dự phòng", value: "Spare Tire" },
  { label: "Bơm xe mini", value: "Mini Pump" },
  { label: "Yên xe êm ái", value: "Comfortable Seat" },
  { label: "Chắn bùn", value: "Mudguard" },
  { label: "Gương chiếu hậu", value: "Mirror" },
];

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  currentVehicleType,
}) => {
  const [activeVehicleType, setActiveVehicleType] = useState<
    "CAR" | "MOTORBIKE" | "BICYCLE"
  >(currentVehicleType || "CAR");

  const [filters, setFilters] = useState<FilterValues>({
    priceRange: [0, 2000000],
    carType: "",
    transmission: "",
    fuelType: "",
    features: [],
    hasDriver: false,
    shipToAddress: false,
    ratingFiveStarsOnly: false,
    numberSeat: undefined,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset filters when vehicle type changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      carType: "",
      transmission: "",
      fuelType: "",
      features: [],
      numberSeat: undefined,
    }));
    setShowAllFeatures(false);
  }, [activeVehicleType]);

  // Update active vehicle type when modal opens
  useEffect(() => {
    if (isOpen && currentVehicleType) {
      setActiveVehicleType(currentVehicleType);
      setIsSearching(false);
    }
  }, [isOpen, currentVehicleType]);

  // HÀM LẤY FEATURES THEO LOẠI XE
  const getCurrentFeatures = () => {
    switch (activeVehicleType) {
      case "CAR":
        return CAR_FEATURES;
      case "MOTORBIKE":
        return MOTORBIKE_FEATURES;
      case "BICYCLE":
        return BICYCLE_FEATURES;
      default:
        return [];
    }
  };

  // HÀM TOGGLE FEATURE
  const toggleFeature = (featureValue: string) => {
    setFilters((prev) => ({
      ...prev,
      features: prev.features.includes(featureValue)
        ? prev.features.filter((f) => f !== featureValue)
        : [...prev.features, featureValue],
    }));
  };

  const handleSearch = async () => {
    setIsSearching(true);

    // Build search parameters correctly according to API
    const searchParams: Record<string, unknown> = {
      vehicleTypes: [activeVehicleType],
      costFrom: filters.priceRange[0],
      costTo: filters.priceRange[1],
    };

    // Add vehicle-specific parameters
    if (activeVehicleType === "CAR") {
      // For cars, set numberSeat based on carType
      if (filters.carType) {
        const selectedCarType = CAR_TYPES.find(
          (t) => t.value === filters.carType
        );
        if (selectedCarType) {
          searchParams.numberSeat = selectedCarType.seats;
        }
      }
      if (filters.transmission)
        searchParams.transmission = filters.transmission;
      if (filters.fuelType) searchParams.fuelType = filters.fuelType;
    } else if (activeVehicleType === "MOTORBIKE") {
      // For motorbikes, transmission maps to different field
      if (filters.transmission) {
        searchParams.transmission = filters.transmission;
      }
      if (filters.fuelType) searchParams.fuelType = filters.fuelType;
    }

    // THÊM FEATURES VÀO SEARCH PARAMS
    if (filters.features.length > 0) {
      searchParams.features = filters.features;
    }

    // Add common parameters
    if (filters.hasDriver) searchParams.haveDriver = "YES";
    if (filters.shipToAddress) searchParams.shipToAddress = "YES";
    if (filters.ratingFiveStarsOnly) searchParams.ratingFiveStarsOnly = true;

    console.log("Advanced search filters being sent:", searchParams);

    try {
      await onSearch(searchParams);
      onClose();
    } catch (error) {
      console.error("Advanced search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentTransmissions = () => {
    switch (activeVehicleType) {
      case "CAR":
        return CAR_TRANSMISSIONS;
      case "MOTORBIKE":
        return MOTORBIKE_TRANSMISSIONS;
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  // Mobile content
  const renderContent = () => (
    <div className={isMobile ? "p-4" : "p-6"}>
      <div className={isMobile ? "space-y-6" : "grid grid-cols-12 gap-6"}>
        {/* Vehicle Type & Price Section */}
        <div className={isMobile ? "" : "col-span-4"}>
          {/* Vehicle Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Loại xe
            </label>
            <div className="space-y-2">
              {[
                { type: "CAR" as const, icon: Car, label: "Ô tô" },
                {
                  type: "MOTORBIKE" as const,
                  icon: Motorbike,
                  label: "Xe máy",
                },
                { type: "BICYCLE" as const, icon: Bike, label: "Xe đạp" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  className={`w-full flex items-center justify-start p-3 border rounded-lg transition-colors ${
                    activeVehicleType === type
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveVehicleType(type)}
                  disabled={isSearching}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Khoảng giá (VNĐ/ngày)
            </label>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <Slider
                range
                min={0}
                max={3000000}
                step={50000}
                value={filters.priceRange}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: value as [number, number],
                  }))
                }
                className="mb-4"
                disabled={isSearching}
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{formatCurrency(filters.priceRange[0])}</span>
                <span>{formatCurrency(filters.priceRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tùy chọn khác
            </label>
            <div className="space-y-2 p-4 bg-white border border-gray-200 rounded-lg">
              {(activeVehicleType === "CAR" ||
                activeVehicleType === "MOTORBIKE") && (
                <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={filters.hasDriver}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        hasDriver: e.target.checked,
                      }))
                    }
                    disabled={isSearching}
                  />
                  <span className="text-sm text-gray-700">Có tài xế</span>
                </label>
              )}
              <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                <Checkbox
                  checked={filters.shipToAddress}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      shipToAddress: e.target.checked,
                    }))
                  }
                  disabled={isSearching}
                />
                <span className="text-sm text-gray-700">Giao xe tận nơi</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                <Checkbox
                  checked={filters.ratingFiveStarsOnly}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      ratingFiveStarsOnly: e.target.checked,
                    }))
                  }
                  disabled={isSearching}
                />
                <span className="text-sm text-gray-700">Chỉ xe 5 sao</span>
              </label>
            </div>
          </div>
        </div>

        {/* Vehicle Specific Options */}
        <div className={isMobile ? "" : "col-span-8"}>
          {/* Car Type */}
          {activeVehicleType === "CAR" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Loại ô tô
              </label>
              <div
                className={`grid ${
                  isMobile ? "grid-cols-2" : "grid-cols-3"
                } gap-3 p-4 bg-white border border-gray-200 rounded-lg`}
              >
                {CAR_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border transition-all ${
                      filters.carType === type.value
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent"
                    }`}
                  >
                    <Checkbox
                      checked={filters.carType === type.value}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          carType: e.target.checked ? type.value : "",
                          numberSeat: e.target.checked ? type.seats : undefined,
                        }))
                      }
                      disabled={isSearching}
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Transmission */}
          {(activeVehicleType === "CAR" ||
            activeVehicleType === "MOTORBIKE") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {activeVehicleType === "CAR" ? "Hộp số" : "Loại xe máy"}
              </label>
              <div
                className={`grid ${
                  isMobile ? "grid-cols-1" : "grid-cols-3"
                } gap-3 p-4 bg-white border border-gray-200 rounded-lg`}
              >
                {getCurrentTransmissions().map((transmission) => (
                  <label
                    key={transmission.value}
                    className={`flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border transition-all ${
                      filters.transmission === transmission.value
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent"
                    }`}
                  >
                    <Checkbox
                      checked={filters.transmission === transmission.value}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          transmission: e.target.checked
                            ? transmission.value
                            : "",
                        }))
                      }
                      disabled={isSearching}
                    />
                    <span className="text-sm text-gray-700">
                      {transmission.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fuel Type */}
          {(activeVehicleType === "CAR" ||
            activeVehicleType === "MOTORBIKE") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nhiên liệu
              </label>
              <div
                className={`grid ${
                  isMobile ? "grid-cols-2" : "grid-cols-3"
                } gap-3 p-4 bg-white border border-gray-200 rounded-lg`}
              >
                {FUEL_TYPES.filter(
                  (fuel) =>
                    activeVehicleType === "CAR" || fuel.value !== "DIESEL"
                ).map((fuel) => (
                  <label
                    key={fuel.value}
                    className={`flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border transition-all ${
                      filters.fuelType === fuel.value
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent"
                    }`}
                  >
                    <Checkbox
                      checked={filters.fuelType === fuel.value}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          fuelType: e.target.checked ? fuel.value : "",
                        }))
                      }
                      disabled={isSearching}
                    />
                    <span className="text-sm text-gray-700">{fuel.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* FEATURES SECTION */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tiện ích xe{" "}
              {filters.features.length > 0 && `(${filters.features.length})`}
            </label>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div
                className={`grid ${
                  isMobile ? "grid-cols-2" : "grid-cols-3"
                } gap-2`}
              >
                {getCurrentFeatures()
                  // .slice(0, showAllFeatures ? undefined : 9)
                  .map((feature) => (
                    <label
                      key={feature.value}
                      className={`flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border transition-all ${
                        filters.features.includes(feature.value)
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent"
                      }`}
                    >
                      <Checkbox
                        checked={filters.features.includes(feature.value)}
                        onChange={() => toggleFeature(feature.value)}
                        disabled={isSearching}
                      />
                      <span className="text-sm text-gray-700">
                        {feature.label}
                      </span>
                    </label>
                  ))}
              </div>

              {/* Show more/less button */}
              {/* {getCurrentFeatures().length > 9 && (
                <button
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  disabled={isSearching}
                >
                  {showAllFeatures
                    ? "Thu gọn"
                    : `Xem thêm ${
                        getCurrentFeatures().length - 9
                      } tiện ích khác`}
                </button>
              )} */}

              {/* Clear all features button */}
              {filters.features.length > 0 && (
                <button
                  className="mt-2 ml-4 text-sm text-red-600 hover:text-red-700"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, features: [] }))
                  }
                  disabled={isSearching}
                >
                  Xóa tất cả tiện ích
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-3 justify-end ${isMobile ? "mt-6" : "mt-8"}`}>
        <button
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          onClick={onClose}
          disabled={isSearching}
        >
          Hủy
        </button>
        <button
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors font-medium"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              <span>Đang tìm...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              <span>Tìm kiếm</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <Drawer
        title={
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-2 text-blue-600" />
            <span>Tìm kiếm nâng cao</span>
          </div>
        }
        placement="bottom"
        height="90%"
        open={isOpen}
        onClose={onClose}
        className="advanced-search-drawer"
      >
        {renderContent()}
      </Drawer>
    );
  }

  // Desktop Modal
  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div
          className="relative w-full max-w-5xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col z-10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Tìm kiếm nâng cao
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSearching}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </div>
      </div>
    </Portal>
  );
};

export default AdvancedSearchModal;
