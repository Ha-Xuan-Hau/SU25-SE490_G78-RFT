import React from "react";
import { Icon } from "@iconify/react";
import { Dispatch, SetStateAction } from "react";

export type FilterState = {
  vehicleType: string | null;
  carType: string | null; // For car's type (sedan, SUV, etc.)
  bicycleType: string | null; // For bicycle's type
  transmission: string | null; // For transmission type
  brand: string | null;
  rate: boolean;
  delivery: boolean;
  hourly: boolean;
  instantBooking: boolean;
  noDeposit: boolean;
  discount: boolean;
};

interface VehicleFilterProps {
  filters: FilterState;
  setFilters: Dispatch<SetStateAction<FilterState>>;
}

const VehicleFilter: React.FC<VehicleFilterProps> = ({
  filters,
  setFilters,
}) => {
  const toggleFilter = (key: keyof FilterState, value?: any) => {
    if (typeof value !== "undefined") {
      setFilters({ ...filters, [key]: value });
    } else if (typeof filters[key] === "boolean") {
      setFilters({ ...filters, [key]: !filters[key] });
    }
  };

  // Function to clear all type-specific filters when changing vehicle type
  const handleVehicleTypeChange = (newType: string | null) => {
    setFilters({
      ...filters,
      vehicleType: newType,
      carType: null,
      bicycleType: null,
      transmission: null,
      brand: null,
    });
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      {/* Type of vehicle */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Chọn xe</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded ${
              filters.vehicleType === "Car"
                ? "bg-primary/10 border-primary text-primary"
                : ""
            }`}
            onClick={() =>
              handleVehicleTypeChange(
                filters.vehicleType === "Car" ? null : "Car"
              )
            }
          >
            <Icon icon="mdi:car" width={24} className="mb-1" />
            <p className="text-sm">Ô tô</p>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded ${
              filters.vehicleType === "Motorcycle"
                ? "bg-primary/10 border-primary text-primary"
                : ""
            }`}
            onClick={() =>
              handleVehicleTypeChange(
                filters.vehicleType === "Motorcycle" ? null : "Motorcycle"
              )
            }
          >
            <Icon icon="mdi:motorcycle" width={24} className="mb-1" />
            <p className="text-sm">Xe máy</p>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded ${
              filters.vehicleType === "Bicycle"
                ? "bg-primary/10 border-primary text-primary"
                : ""
            }`}
            onClick={() =>
              handleVehicleTypeChange(
                filters.vehicleType === "Bicycle" ? null : "Bicycle"
              )
            }
          >
            <Icon icon="mdi:bicycle" width={24} className="mb-1" />
            <p className="text-sm">Xe đạp</p>
          </button>
        </div>
      </div>

      {/* Car specific filters */}
      {filters.vehicleType === "Car" && (
        <>
          {/* Car type */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Loại xe</h3>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                setFilters({ ...filters, carType: e.target.value || null })
              }
              value={filters.carType || ""}
            >
              <option value="">Tất cả các loại</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="hatchback">Hatchback</option>
              <option value="mpv">MPV</option>
            </select>
          </div>

          {/* Transmission */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Hộp số</h3>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                setFilters({ ...filters, transmission: e.target.value || null })
              }
              value={filters.transmission || ""}
            >
              <option value="">Tất cả hộp số</option>
              <option value="auto">Tự động</option>
              <option value="manual">Số sàn</option>
              <option value="cvt">CVT</option>
            </select>
          </div>

          {/* Car brand */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Hãng xe</h3>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                setFilters({ ...filters, brand: e.target.value || null })
              }
              value={filters.brand || ""}
            >
              <option value="">Tất cả các hãng</option>
              <option value="toyota">Toyota</option>
              <option value="hyundai">Hyundai</option>
              <option value="kia">Kia</option>
              <option value="mazda">Mazda</option>
              <option value="honda">Honda</option>
            </select>
          </div>
        </>
      )}

      {/* Motorcycle specific filters */}
      {filters.vehicleType === "Motorcycle" && (
        <>
          {/* Transmission */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Hộp số</h3>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                setFilters({ ...filters, transmission: e.target.value || null })
              }
              value={filters.transmission || ""}
            >
              <option value="">Tất cả hộp số</option>
              <option value="auto">Tự động</option>
              <option value="manual">Số côn</option>
            </select>
          </div>

          {/* Motorcycle brand */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Hãng xe</h3>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                setFilters({ ...filters, brand: e.target.value || null })
              }
              value={filters.brand || ""}
            >
              <option value="">Tất cả các hãng</option>
              <option value="honda">Honda</option>
              <option value="yamaha">Yamaha</option>
              <option value="suzuki">Suzuki</option>
              <option value="kawasaki">Kawasaki</option>
            </select>
          </div>
        </>
      )}

      {/* Bicycle specific filters */}
      {filters.vehicleType === "Bicycle" && (
        <>
          {/* Bicycle type */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Loại xe</h3>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) =>
                setFilters({ ...filters, bicycleType: e.target.value || null })
              }
              value={filters.bicycleType || ""}
            >
              <option value="">Tất cả các loại</option>
              <option value="mountain">Xe đạp thông dụng</option>
              <option value="city">Xe đạp thể thao</option>
              <option value="folding">Xe đạp thể thao cao cấp</option>
            </select>
          </div>
        </>
      )}

      {/* Location - always show */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Khu vực</h3>
        <select className="w-full p-2 border rounded">
          <option>Hà Nội</option>
        </select>
      </div>

      {/* District - always show */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Chọn quận/huyện</h3>
        <select className="w-full p-2 border rounded">
          <option>Tất cả</option>
          <option>Cầu Giấy</option>
          <option>Hoàng Mai</option>
          <option>Đống Đa</option>
        </select>
      </div>

      <button className="w-full bg-primary text-white py-2 rounded">
        Áp dụng
      </button>
    </div>
  );
};

export default VehicleFilter;
