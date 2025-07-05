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
    <div>
      <div className="relative rounded-2xl border border-dark/10 dark:border-white/10 group hover:shadow-3xl duration-300 dark:hover:shadow-white/20">
        <div className="overflow-hidden rounded-t-2xl">
          <Link href={`/vehicles/${id}`}>
            {mainImage && (
              <Image
                src={mainImage}
                alt={`${thumb}`}
                width={440}
                height={250}
                className="w-full rounded-t-xl"
                unoptimized={true}
              />
            )}
          </Link>
          {/* <div className="absolute top-6 right-6 p-4 bg-white rounded-full hidden group-hover:block">
            <Icon
              icon={"solar:arrow-right-linear"}
              width={24}
              height={24}
              className="text-black"
            />
          </div> */}
        </div>
        <div className="p-6">
          <div className="flex flex-col mobile:flex-row gap-5 mobile:gap-0 justify-between mb-6">
            <div>
              <Link href={`/vehicles/${id}`}>
                <h3 className="text-xl font-medium text-black dark:text-white duration-300 group-hover:text-primary line-clamp-1">
                  {thumb}
                </h3>
              </Link>
              <p className="text-base font-normal text-black/50 dark:text-white/50">
                {address}
              </p>
            </div>
          </div>
          <hr className="my-4 border-t border-black/10 dark:border-white/10" />

          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-1">
              <Icon icon={"solar:transmission-bold"} width={20} height={20} />
              <p className="text-sm font-normal text-black dark:text-white">
                {transmission}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon={"mdi:car-seat"} width={20} height={20} />
              <p className="text-sm font-normal text-black dark:text-white">
                {numberSeat} chỗ
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon={"mdi:fuel"} width={20} height={20} />
              <p className="text-sm font-normal text-black dark:text-white">
                {fuelType}
              </p>
            </div>
          </div>

          <hr className="my-4 border-t border-black/10 dark:border-white/10" />

          {/* Price and Rating Row */}
          <div className="flex justify-between items-center">
            {/* Rating - Left Side */}
            <div className="flex items-center">
              <div className="flex items-center">
                {rating > 0 ? (
                  <p className="font-medium text-black dark:text-white flex items-center">
                    {rating}
                    <Icon
                      icon={"material-symbols:star-rate-rounded"}
                      width={20}
                      height={20}
                      className="ml-0.5 text-yellow-400"
                    />
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Chưa có đánh giá
                  </p>
                )}
              </div>
            </div>

            {/* Price - Right Side */}
            <button className="text-base font-medium text-primary px-5 py-2 rounded-full bg-primary/10">
              {costPerDay.toLocaleString()} VND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
