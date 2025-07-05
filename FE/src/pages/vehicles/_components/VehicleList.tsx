import type React from "react";
import VehicleCard from "@/components/Home/Vehicle/Card/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Vehicle } from "@/types/vehicle";

interface VehicleListingProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
}

const VehicleListing: React.FC<VehicleListingProps> = ({
  vehicles,
  isLoading,
  error,
}) => {
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
        <p className="text-gray-500 mt-2">Vui lòng thử lại sau: {error}</p>
      </div>
    );
  }

  // Trường hợp không có xe nào sau khi lọc
  if (!vehicles || vehicles.length === 0) {
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
        <h1 className="text-2xl font-semibold">Danh sách xe</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle: Vehicle) => (
          <div key={vehicle.id} className="h-full">
            <VehicleCard item={vehicle} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleListing;
