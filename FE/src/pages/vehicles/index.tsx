import React, { useState } from "react";
import VehicleFilter from "./_components/VehicleFilter";
import VehicleListing from "./_components/VehicleList";
import { Icon } from "@iconify/react/dist/iconify.js";

type FilterState = {
  vehicleType: string | null;
  carType: string | null;
  bicycleType: string | null;
  transmission: string | null;
  brand: string | null;
  rate: boolean;
  delivery: boolean;
  hourly: boolean;
  instantBooking: boolean;
  noDeposit: boolean;
  discount: boolean;
};

const ListVehiclePage = () => {
  const [filters, setFilters] = useState<FilterState>({
    vehicleType: null,
    carType: null,
    bicycleType: null,
    transmission: null,
    brand: null,
    rate: false,
    delivery: false,
    hourly: false,
    instantBooking: false,
    noDeposit: false,
    discount: false,
  });

  return (
    <section className="container mx-auto px-4 2xl:px-0 py-4">
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
