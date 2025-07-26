// @/app/vehicles/_components/AdvancedSearchModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Car, BikeIcon as Motorbike, Bike, Search } from "lucide-react";
import { Checkbox, Slider } from "antd";
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
}

const CAR_TYPES = [
  { value: "MINI", label: "4 chỗ (Mini)" },
  { value: "SEDAN", label: "4 chỗ (Sedan)" },
  { value: "CUV", label: "5 chỗ (CUV)" },
  { value: "SUV", label: "7 chỗ (SUV)" },
  { value: "MPV", label: "7 chỗ (MPV)" },
  { value: "PICKUP", label: "Bán tải" },
];

const CAR_TRANSMISSIONS = [
  { value: "AUTOMATIC", label: "Tự động" },
  { value: "MANUAL", label: "Số sàn" },
];

const MOTORBIKE_TRANSMISSIONS = [
  { value: "GA", label: "Xe ga" },
  { value: "SO", label: "Xe số" },
  { value: "CON", label: "Xe côn" },
];

const FUEL_TYPES = [
  { value: "GASOLINE", label: "Xăng" },
  { value: "DIESEL", label: "Dầu diesel" },
  { value: "ELECTRIC", label: "Điện" },
];

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
  { value: "REPAIR_KIT", label: "Bộ sửa chữa" },
  { value: "PHONE_HOLDER", label: "Giá đỡ điện thoại" },
];

const BICYCLE_FEATURES = [
  { value: "HELMET", label: "Mũ bảo hiểm" },
  { value: "BASKET", label: "Giỏ đựng đồ" },
  { value: "LIGHT", label: "Đèn" },
  { value: "LOCK", label: "Khóa" },
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
  });

  const [isSearching, setIsSearching] = useState(false);

  // Prevent body scroll when modal is open và cải thiện xử lý z-index
  useEffect(() => {
    if (isOpen) {
      // Lưu scroll position
      const scrollY = window.scrollY;

      // Ngăn scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      // Thêm class để đảm bảo modal luôn ở trên
      document.documentElement.style.overflow = "hidden";
    } else {
      // Khôi phục scroll
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  // Reset filters when vehicle type changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      carType: "",
      transmission: "",
      fuelType: "",
      features: [],
    }));
  }, [activeVehicleType]);

  // Update active vehicle type when modal opens
  useEffect(() => {
    if (isOpen && currentVehicleType) {
      setActiveVehicleType(currentVehicleType);
      setIsSearching(false);
    }
  }, [isOpen, currentVehicleType]);

  const handleSearch = async () => {
    setIsSearching(true);

    const searchParams: Record<string, unknown> = {
      vehicleTypes: [activeVehicleType],
      costFrom: filters.priceRange[0],
      costTo: filters.priceRange[1],
    };

    if (activeVehicleType === "CAR") {
      if (filters.carType) searchParams.carType = filters.carType;
      if (filters.transmission)
        searchParams.transmission = filters.transmission;
      if (filters.fuelType) searchParams.fuelType = filters.fuelType;
      if (filters.hasDriver) searchParams.haveDriver = "YES";
    } else if (activeVehicleType === "MOTORBIKE") {
      if (filters.transmission)
        searchParams.motorbikeType = filters.transmission;
      if (filters.fuelType) searchParams.fuelType = filters.fuelType;
      if (filters.hasDriver) searchParams.haveDriver = "YES";
    }

    if (filters.shipToAddress) searchParams.shipToAddress = "YES";
    if (filters.ratingFiveStarsOnly) searchParams.ratingFiveStarsOnly = true;
    if (filters.features.length > 0) searchParams.features = filters.features;

    try {
      await onSearch(searchParams);
      // Đóng modal sau khi search thành công
      onClose();
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFeatureChange = (featureValue: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      features: checked
        ? [...prev.features, featureValue]
        : prev.features.filter((f) => f !== featureValue),
    }));
  };

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

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{ isolation: "isolate" }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative w-full max-w-6xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl flex-shrink-0">
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

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* ... Nội dung form giữ nguyên ... */}
              <div className="grid grid-cols-12 gap-6 h-full">
                {/* Left column */}
                <div className="col-span-4">
                  {/* Vehicle Type Selector */}
                  <div className="mb-8">
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
                        {
                          type: "BICYCLE" as const,
                          icon: Bike,
                          label: "Xe đạp",
                        },
                      ].map(({ type, icon: Icon, label }) => (
                        <button
                          key={type}
                          className={`w-full flex items-center justify-start p-4 border rounded-lg transition-colors ${
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
                  <div className="mb-8">
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
                          <span className="text-sm text-gray-700">
                            Có tài xế
                          </span>
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
                        <span className="text-sm text-gray-700">
                          Giao xe tận nơi
                        </span>
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
                        <span className="text-sm text-gray-700">
                          Chỉ xe 5 sao
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="col-span-8">
                  {/* Car Type */}
                  {activeVehicleType === "CAR" && (
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Loại ô tô
                      </label>
                      <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                        {CAR_TYPES.map((type) => (
                          <label
                            key={type.value}
                            className={`flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg border transition-all ${
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
                                }))
                              }
                              disabled={isSearching}
                            />
                            <span className="text-sm text-gray-700">
                              {type.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transmission */}
                  {(activeVehicleType === "CAR" ||
                    activeVehicleType === "MOTORBIKE") && (
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {activeVehicleType === "CAR" ? "Hộp số" : "Loại xe máy"}
                      </label>
                      <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                        {getCurrentTransmissions().map((transmission) => (
                          <label
                            key={transmission.value}
                            className={`flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg border transition-all ${
                              filters.transmission === transmission.value
                                ? "border-blue-200 bg-blue-50"
                                : "border-transparent"
                            }`}
                          >
                            <Checkbox
                              checked={
                                filters.transmission === transmission.value
                              }
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
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Nhiên liệu
                      </label>
                      <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                        {FUEL_TYPES.filter(
                          (fuel) =>
                            activeVehicleType === "CAR" ||
                            (fuel.value !== "DIESEL" && fuel.value !== "HYBRID")
                        ).map((fuel) => (
                          <label
                            key={fuel.value}
                            className={`flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg border transition-all ${
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
                            <span className="text-sm text-gray-700">
                              {fuel.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tính năng & Tiện ích
                    </label>
                    <div className="grid grid-cols-3 gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                      {getCurrentFeatures().map((feature) => (
                        <label
                          key={feature.value}
                          className={`flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg border transition-all ${
                            filters.features.includes(feature.value)
                              ? "border-blue-200 bg-blue-50"
                              : "border-transparent"
                          }`}
                        >
                          <Checkbox
                            checked={filters.features.includes(feature.value)}
                            onChange={(e) =>
                              handleFeatureChange(
                                feature.value,
                                e.target.checked
                              )
                            }
                            disabled={isSearching}
                          />
                          <span className="text-sm text-gray-700">
                            {feature.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-xl flex-shrink-0">
            <div className="flex gap-3 justify-end">
              <button
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium disabled:opacity-50"
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
        </div>
      </div>
    </Portal>
  );
};

export default AdvancedSearchModal;
