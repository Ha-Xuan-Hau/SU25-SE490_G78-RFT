import React, { useState } from "react";
import VehicleFilter from "./_components/VehicleFilter";
import VehicleListing from "./_components/VehicleList";
import { VehicleFilters } from "@/types/vehicle"; // Sử dụng interface có sẵn

const ListVehiclePage = () => {
  const [filters, setFilters] = useState<VehicleFilters>({
    vehicleType: undefined,
    brand: undefined,
    seats: undefined,
    minRating: undefined,
    shipToAddress: false,
    hasDiscount: false,
  });

  return (
    <section className="container mx-auto px-4 2xl:px-0 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filter */}
        <div className="lg:w-1/4">
          <VehicleFilter filters={filters} setFilters={setFilters} />
        </div>

        {/* Vehicle listing */}
        <div className="lg:w-3/4">
          <VehicleListing filters={filters} />
        </div>
      </div>
    </section>
  );
};

export default ListVehiclePage;
