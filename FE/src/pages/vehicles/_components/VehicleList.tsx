// @/app/vehicles/_components/VehicleList.tsx
"use client";

import React from "react";
import { Pagination } from "antd";
import VehicleCard from "@/components/Home/Vehicle/Card/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Vehicle } from "@/types/vehicle";
import { Search, AlertCircle, RefreshCw } from "lucide-react";

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
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 lg:py-16">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 text-sm lg:text-base">
            Đang tìm kiếm xe phù hợp...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-8">
        <div className="text-center py-12 lg:py-16">
          <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 mb-4 flex items-center justify-center bg-red-50 rounded-full">
            <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />
          </div>
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
            Đã xảy ra lỗi
          </h3>
          <p className="text-sm lg:text-base text-gray-600 mb-4 px-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-8">
        <div className="text-center py-12 lg:py-16">
          <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 mb-4 flex items-center justify-center bg-gray-50 rounded-full">
            <Search className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
          </div>
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy xe nào
          </h3>
          <p className="text-sm lg:text-base text-gray-600 mb-6 max-w-md mx-auto px-4">
            Không có xe nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử điều
            chỉnh bộ lọc hoặc mở rộng khu vực tìm kiếm.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Làm mới trang
            </button>
            <button
              onClick={() => {
                const filterSection = document.querySelector(
                  "[data-filter-section]"
                );
                filterSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Điều chỉnh bộ lọc
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Vehicle Grid */}
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="h-full">
              <VehicleCard item={vehicle} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalItems > pageSize && (
          <div className="flex justify-center mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200">
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              onChange={onPageChange}
              showSizeChanger={false}
              showQuickJumper={false} // Tắt quick jumper trên mobile
              showTotal={(total, range) => (
                <span className="text-xs lg:text-sm">
                  {`${range[0]}-${range[1]} của ${total} xe`}
                </span>
              )}
              size="small" // Sử dụng size nhỏ cho mobile
              responsive={true}
              className="text-center"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleListing;
