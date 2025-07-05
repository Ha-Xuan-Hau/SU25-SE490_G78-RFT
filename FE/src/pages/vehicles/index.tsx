"use client";

import { useEffect, useState } from "react";
import VehicleFilter from "./_components/VehicleFilter";
import VehicleListing from "./_components/VehicleList";
import type { VehicleFilters, Vehicle } from "@/types/vehicle";
import { getVehicles } from "@/apis/vehicle.api";

const ListVehiclePage = () => {
  const [filters, setFilters] = useState<VehicleFilters>({
    vehicleType: undefined,
    maxRating: undefined,
    shipToAddress: false,
    hasDriver: false,
    city: undefined,
    district: undefined,
    ward: undefined,
    minPrice: 0,
    maxPrice: 3000000,
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [errorVehicles, setErrorVehicles] = useState<string | null>(null);

  // Hàm này sẽ được truyền xuống VehicleFilter để nhận kết quả tìm kiếm
  const handleApplyFilters = (
    fetchedVehicles: Vehicle[],
    loading: boolean,
    error: string | null
  ) => {
    setVehicles(fetchedVehicles);
    setIsLoadingVehicles(loading);
    setErrorVehicles(error);
  };

  // useEffect để fetch dữ liệu ban đầu khi component mount
  useEffect(() => {
    const fetchInitialVehicles = async () => {
      setIsLoadingVehicles(true);
      setErrorVehicles(null);
      try {
        const initialVehicles = await getVehicles();
        setVehicles(initialVehicles);
      } catch (err: any) {
        console.error("Lỗi khi tải xe ban đầu:", err);
        setErrorVehicles(err.message || "Không thể tải danh sách xe ban đầu.");
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchInitialVehicles();
  }, []);

  return (
    <section className="container mx-auto px-4 2xl:px-0 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <VehicleFilter
            filters={filters}
            setFilters={setFilters}
            onApplyFilters={handleApplyFilters} // Truyền hàm callback
          />
          {/* <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-sm dark:text-gray-200">
            <h3 className="font-semibold mb-2">Trạng thái bộ lọc hiện tại:</h3>
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div> */}
        </div>
        <div className=" lg:w-3/4">
          <VehicleListing
            vehicles={vehicles}
            isLoading={isLoadingVehicles}
            error={errorVehicles}
          />
        </div>
      </div>
    </section>
  );
};
export default ListVehiclePage;
