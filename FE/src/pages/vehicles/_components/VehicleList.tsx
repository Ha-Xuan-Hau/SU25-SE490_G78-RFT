import { vehicleCar } from "@/apis/vehicles";
import VehicleCard from "@/components/Home/Vehicle/Card/Card";
import { FilterState } from "./VehicleFilter";

interface VehicleListingProps {
  filters: FilterState;
}

const VehicleList: React.FC<VehicleListingProps> = ({ filters }) => {
  // You can use the filters prop here to filter the vehicles
  const filteredVehicles = vehicleCar.filter((vehicle) => {
    if (filters.vehicleType && vehicle.vehicleType !== filters.vehicleType) {
      return false;
    }
    if (filters.brand && vehicle.brand !== filters.brand) {
      return false;
    }
    return true;
  });

  return (
    <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {filteredVehicles.map((item, index) => (
          <div key={index} className="">
            <VehicleCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleList;
