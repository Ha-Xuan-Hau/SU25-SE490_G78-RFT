import VehicleCard from "@/components/Home/Vehicle/Card/Card";
import { vehicleCar } from "@/app/api/vehicles";

const VehicleListing: React.FC = () => {
  return (
    <section className="pt-0!">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {vehicleCar.map((item, index) => (
            <div key={index} className="">
              <VehicleCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VehicleListing;
