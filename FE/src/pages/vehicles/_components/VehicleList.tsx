import type React from "react";
import { Pagination } from "antd";
import VehicleCard from "@/components/Home/Vehicle/Card/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Vehicle } from "@/types/vehicle";

interface VehicleListingProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number, pageSize?: number) => void;
}

const VehicleListing: React.FC<VehicleListingProps> = ({
  vehicles,
  isLoading,
  error,
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  // Hiển thị trạng thái loading
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-center items-center py-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center py-32">
          <p className="text-red-500 text-lg font-medium">
            Đã xảy ra lỗi khi tải dữ liệu
          </p>
          <p className="text-gray-500 mt-2">Vui lòng thử lại sau: {error}</p>
        </div>
      </div>
    );
  }

  // Trường hợp không có xe nào sau khi lọc
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center py-32">
          <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Không tìm thấy xe nào
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Vui lòng thử với bộ lọc khác hoặc mở rộng điều kiện tìm kiếm
          </p>
          {/* <p className="text-xs text-gray-400">
            Debug: vehicles={vehicles?.length || 0}, totalItems={totalItems},
            currentPage={currentPage}
          </p> */}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      {/* Grid hiển thị 4 cards trên 1 hàng với responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 mb-8">
        {vehicles.map((vehicle: Vehicle) => (
          <div key={vehicle.id} className="h-full">
            <VehicleCard item={vehicle} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalItems > pageSize && (
        <div className="flex justify-center mt-8">
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} xe`
            }
            className="text-center"
          />
        </div>
      )}
    </div>
  );
};

export default VehicleListing;
