import { Vehicle } from "@/types/vehicle";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";

const VehicleCard: React.FC<{ item: Vehicle }> = ({ item }) => {
  const {
    id,
    costPerDay,
    thumb,
    numberSeat,
    transmission,
    fuelType,
    vehicleImages,
    rating,
    address,
  } = item;

  const mainImage = vehicleImages[0]?.imageUrl;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative rounded-2xl border border-dark/10 dark:border-white/10 group hover:shadow-3xl duration-300 dark:hover:shadow-white/20 h-full flex flex-col">
        <div className="overflow-hidden rounded-t-2xl flex-shrink-0">
          <Link href={`/vehicles/${id}`}>
            {mainImage && (
              <Image
                src={mainImage}
                alt={`${thumb}`}
                width={440}
                height={200}
                className="w-full h-48 object-cover rounded-t-xl"
                unoptimized={true}
              />
            )}
          </Link>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-3">
            <Link href={`/vehicles/${id}`}>
              <h3 className="text-lg font-medium text-black dark:text-white duration-300 group-hover:text-primary line-clamp-2 mb-1">
                {thumb}
              </h3>
            </Link>
            <p className="text-sm font-normal text-black/50 dark:text-white/50 line-clamp-1">
              {address}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="flex flex-col items-center text-center">
              <Icon
                icon={"solar:transmission-bold"}
                width={16}
                height={16}
                className="mb-1"
              />
              <p className="text-black dark:text-white truncate w-full">
                {transmission}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Icon
                icon={"mdi:car-seat"}
                width={16}
                height={16}
                className="mb-1"
              />
              <p className="text-black dark:text-white truncate w-full">
                {numberSeat} chỗ
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Icon icon={"mdi:fuel"} width={16} height={16} className="mb-1" />
              <p className="text-black dark:text-white truncate w-full">
                {fuelType}
              </p>
            </div>
          </div>

          <hr className="my-3 border-t border-black/10 dark:border-white/10" />

          {/* Price and Rating Row */}
          <div className="flex justify-between items-center mt-auto">
            {/* Rating - Left Side */}
            <div className="flex items-center">
              {rating > 0 ? (
                <div className="flex items-center">
                  <span className="font-medium text-black dark:text-white text-sm">
                    {rating}
                  </span>
                  <Icon
                    icon={"material-symbols:star-rate-rounded"}
                    width={16}
                    height={16}
                    className="ml-0.5 text-yellow-400"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Chưa có đánh giá</p>
              )}
            </div>

            {/* Price - Right Side */}
            <div className="text-right">
              <div className="text-sm font-bold text-primary">
                {costPerDay.toLocaleString()}K
              </div>
              <div className="text-xs text-gray-500">/ngày</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
