import React from "react";
import { Icon } from "@iconify/react";
import { Dispatch, SetStateAction } from "react";
import { VehicleFilters } from "@/types/vehicle"; // Sử dụng interface có sẵn

interface VehicleFilterProps {
  filters: VehicleFilters;
  setFilters: Dispatch<SetStateAction<VehicleFilters>>;
}

const VehicleFilter: React.FC<VehicleFilterProps> = ({
  filters,
  setFilters,
}) => {
  // Hàm để cập nhật filters
  const handleFilterChange = (key: keyof VehicleFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      {/* Loại xe */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Loại xe</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "Car"
                ? "bg-primary/10 border-primary text-primary"
                : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() =>
              handleFilterChange(
                "vehicleType",
                filters.vehicleType === "Car" ? undefined : "Car"
              )
            }
          >
            <Icon icon="mdi:car" width={24} className="mb-1" />
            <p className="text-sm">Ô tô</p>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "Motorcycle"
                ? "bg-primary/10 border-primary text-primary"
                : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() =>
              handleFilterChange(
                "vehicleType",
                filters.vehicleType === "Motorcycle" ? undefined : "Motorcycle"
              )
            }
          >
            <Icon icon="mdi:motorcycle" width={24} className="mb-1" />
            <p className="text-sm">Xe máy</p>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-3 border rounded-lg dark:text-white ${
              filters.vehicleType === "BICYCLE"
                ? "bg-primary/10 border-primary text-primary"
                : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() =>
              handleFilterChange(
                "vehicleType",
                filters.vehicleType === "Bicycle" ? undefined : "Bicycle"
              )
            }
          >
            <Icon icon="mdi:bicycle" width={24} className="mb-1" />
            <p className="text-sm">Xe đạp</p>
          </button>
        </div>
      </div>

      {/* Hãng xe */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Hãng xe</h3>
        <select
          className="w-full p-2.5 border rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={filters.brand || ""}
          onChange={(e) =>
            handleFilterChange("brand", e.target.value || undefined)
          }
        >
          <option value="">Tất cả các hãng</option>
          <option value="toyota">Toyota</option>
          <option value="honda">Honda</option>
          <option value="hyundai">Hyundai</option>
          <option value="kia">Kia</option>
          <option value="mazda">Mazda</option>
          <option value="ford">Ford</option>
          <option value="vinfast">VinFast</option>
        </select>
      </div>

      {/* Số chỗ ngồi */}
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
                  ? "bg-primary/10 border-primary text-primary"
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

      {/* Tùy chọn khác */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 dark:text-white">Tùy chọn</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="minRating"
              checked={!!filters.minRating}
              onChange={(e) =>
                handleFilterChange(
                  "minRating",
                  e.target.checked ? 4 : undefined
                )
              }
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="minRating" className="dark:text-white">
              Đánh giá từ 4 sao trở lên
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
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="homeDelivery" className="dark:text-white">
              Giao xe tận nơi
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDiscount"
              checked={!!filters.hasDiscount}
              onChange={(e) =>
                handleFilterChange("hasDiscount", e.target.checked)
              }
              className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="hasDiscount" className="dark:text-white">
              Có khuyến mãi
            </label>
          </div>
        </div>
      </div>

      {/* Nút áp dụng */}
      <button className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg transition-colors font-medium">
        Áp dụng bộ lọc
      </button>

      {/* Nút xóa bộ lọc */}
      <button
        className="w-full mt-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() =>
          setFilters({
            vehicleType: undefined,
            brand: undefined,
            seats: undefined,
            minRating: undefined,
            shipToAddress: false,
            hasDiscount: false,
          })
        }
      >
        Xóa bộ lọc
      </button>
    </div>
  );
};

export default VehicleFilter;
