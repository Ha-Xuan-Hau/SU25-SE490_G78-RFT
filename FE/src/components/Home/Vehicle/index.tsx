import VehicleCard from "./Card/Card";
import { vehicleCar } from "@/app/api/vehicles";

const Vehicle: React.FC = () => {
  return (
    <section>
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="mb-16 flex flex-col gap-3 ">
          <div className="flex gap-2.5 items-center justify-center"></div>
          <h2 className="text-40 lg:text-52 font-medium text-black dark:text-white text-center tracking-tight leading-11 mb-2">
            Xe dành cho bạn
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {vehicleCar.slice(0, 8).map((item, index) => (
            <div key={index} className="h-[500px]">
              <VehicleCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Vehicle;
