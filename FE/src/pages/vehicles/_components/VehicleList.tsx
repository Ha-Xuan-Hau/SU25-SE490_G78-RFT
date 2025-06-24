import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVehicles } from "@/apis/vehicle.api";
import VehicleCard from "@/components/Home/Vehicle/Card/Card";
import LoadingSpinner from "@/components/ui/LoadingSpriner";
import { VehicleFilters, Vehicle } from "@/types/vehicle";

interface VehicleListingProps {
  filters: VehicleFilters;
}

const VehicleListing: React.FC<VehicleListingProps> = ({ filters }) => {
  // Fetch tất cả dữ liệu xe một lần
  const {
    data: allVehicles,
    isLoading,
    error,
  } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  // Sử dụng useMemo để lọc dữ liệu mỗi khi filters hoặc allVehicles thay đổi
  const filteredVehicles = useMemo(() => {
    if (!allVehicles) return [];

    // Bắt đầu với tất cả các xe
    let result = [...allVehicles];

    // Lọc theo loại phương tiện
    if (filters.vehicleType) {
      result = result.filter(
        (vehicle) =>
          vehicle.vehicleType?.toLowerCase() ===
          filters.vehicleType?.toLowerCase()
      );
    }

    // Lọc theo thương hiệu
    if (filters.brand) {
      result = result.filter(
        (vehicle) =>
          vehicle.brandName?.toLowerCase() === filters.brand?.toLowerCase()
      );
    }

    // Lọc theo số chỗ ngồi
    if (filters.seats) {
      result = result.filter((vehicle) => vehicle.numberSeat === filters.seats);
    }

    // Lọc theo đánh giá tối thiểu
    if (filters.minRating) {
      result = result.filter(
        (vehicle) => (vehicle.totalRating || 0) >= filters.minRating!
      );
    }

    // Lọc các xe có giao tận nơi (giả định rằng có một trường trong dữ liệu)
    if (filters.shipToAddress) {
      // Giả sử có trường shipToAddress trong dữ liệu
      // result = result.filter((vehicle) => vehicle.shipToAddress === true);

      // Bạn có thể sử dụng một giá trị khác để lọc nếu không có trường này
      // Ví dụ: chỉ lấy những xe có đánh giá cao
      result = result.filter((vehicle) => (vehicle.totalRating || 0) >= 4);
    }

    // Lọc các xe có khuyến mãi
    if (filters.hasDiscount) {
      // Giả sử có trường discount trong dữ liệu
      // result = result.filter((vehicle) => vehicle.discount > 0);

      // Hoặc lọc theo một điều kiện khác phù hợp
      // Ví dụ: chỉ lấy những xe có giá dưới một mức nhất định
      result = result.filter((vehicle) => vehicle.costPerDay < 1000000);
    }

    return result;
  }, [allVehicles, filters]);

  // Hiển thị trạng thái loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg font-medium">
          Đã xảy ra lỗi khi tải dữ liệu
        </p>
        <p className="text-gray-500 mt-2">Vui lòng thử lại sau</p>
      </div>
    );
  }

  // Trường hợp không có xe nào sau khi lọc
  if (!filteredVehicles || filteredVehicles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg">Không tìm thấy xe nào phù hợp với bộ lọc</p>
        <p className="text-gray-500 mt-2">Vui lòng thử với bộ lọc khác</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Danh sách xe ({filteredVehicles.length})
        </h1>
        <div>
          <select className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white">
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá thấp - cao</option>
            <option value="price-desc">Giá cao - thấp</option>
            <option value="rating">Đánh giá</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle: Vehicle) => (
          <div key={vehicle.id} className="h-full">
            <VehicleCard item={vehicle} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleListing;
