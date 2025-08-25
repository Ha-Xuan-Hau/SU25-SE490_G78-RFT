import { useQuery } from "@tanstack/react-query";
import VehicleCard from "../Home/Card";
import { getVehiclesByTypeAndStatus } from "@/apis/vehicle.api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Bicycle: React.FC = () => {
  const {
    data: vehicles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vehicles", "BICYCLE", "AVAILABLE"],
    queryFn: () => getVehiclesByTypeAndStatus("BICYCLE", "AVAILABLE"),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error)
    return <div className="text-center py-10">Có lỗi khi tải dữ liệu xe</div>;

  return (
    <section className="pt-0 pb-0">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="mb-6 flex flex-col gap-3">
          <h2 className="text-3xl font-bold text-center">Xe đạp</h2>
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

export default Bicycle;
