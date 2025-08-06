import { useQuery } from "@tanstack/react-query";
import VehicleCard from "../Card";
import { getVehiclesByTypeAndStatus } from "@/apis/vehicle.api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Car: React.FC = () => {
  const {
    data: vehicles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vehicles", "CAR", "AVAILABLE"],
    queryFn: () => getVehiclesByTypeAndStatus("CAR", "AVAILABLE"),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error)
    return <div className="text-center py-10">Có lỗi khi tải dữ liệu xe</div>;

  return (
    <section className="pt-16 pb-8">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="mb-16 flex flex-col gap-3 ">
          <div className="flex gap-2.5 items-center justify-center"></div>
          <h2 className="text-40 lg:text-52 font-medium text-black dark:text-white text-center tracking-tight leading-11 mb-2">
            Ô tô
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {vehicles?.slice(0, 8).map((item: any) => (
            <div key={item.id} className="h-[500px]">
              <VehicleCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Car;
