import useLocalStorage from "@/hooks/useLocalStorage";
import { Building, Car, Clock, Edit2, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/dist/client/components/navigation";

interface BusinessRegistrationCardProps {
  statistics?: any;
}

export default function BusinessRegistrationCard({
  statistics,
}: BusinessRegistrationCardProps) {
  const router = useRouter();
  const [providerProfile, , clearProviderProfile] = useLocalStorage(
    "user_profile",
    ""
  );
  // Format giờ làm việc
  const formatWorkingHours = () => {
    if (statistics?.openTime && statistics?.closeTime) {
      const openTime = formatTimestamp(statistics.openTime).split(" ")[1] || "";
      const closeTime =
        formatTimestamp(statistics.closeTime).split(" ")[1] || "";
      if (openTime === "00:00" && closeTime === "00:00") {
        return "Toàn thời gian (24h)";
      }
      return `${openTime} - ${closeTime}`;
    }
    return "Trống";
  };

  // Format loại dịch vụ
  const formatServices = () => {
    const serviceMap: Record<string, string> = {
      CAR: "Ô tô",
      MOTORBIKE: "Xe máy",
      BICYCLE: "Xe đạp",
    };

    if (
      statistics?.registeredServices &&
      statistics.registeredServices.length > 0
    ) {
      return statistics.registeredServices
        .map((service: string) => serviceMap[service] || service)
        .join(", ");
    }
    return "Chưa cập nhật";
  };

  const formatTimestamp = (
    timestamp: number | string | number[] | undefined | null
  ): string => {
    if (!timestamp) return "";

    if (Array.isArray(timestamp) && timestamp.length >= 5) {
      const [year, month, day, hour, minute] = timestamp;
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }

    if (typeof timestamp === "number" || typeof timestamp === "string") {
      const date = new Date(
        typeof timestamp === "number" ? timestamp * 1000 : timestamp
      );
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }

    return "";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Thông tin đăng ký kinh doanh
            </h3>
          </div>
          {providerProfile?.status !== "TEMP_BANNED" && (
            <button
              onClick={() => router.push("/become-provider")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </button>
          )}
        </div>

        <div className="flex items-center mb-5">
          <Building className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Tên người cho thuê:</p>
            <p>{statistics?.providerName || "Chưa cập nhật"}</p>
          </div>
        </div>

        <div className="flex items-center mb-5">
          <MapPin className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Địa chỉ văn phòng:</p>
            <p>{statistics?.providerAddress || "Chưa cập nhật"}</p>
          </div>
        </div>

        <div className="flex items-center mb-5">
          <Phone className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Điện thoại:</p>
            <p>{statistics?.providerPhone || "Chưa cập nhật"}</p>
          </div>
        </div>

        <div className="flex items-center mb-5">
          <Clock className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Giờ hoạt động:</p>
            <p>{formatWorkingHours()}</p>
          </div>
        </div>

        <div className="flex items-center">
          <Car className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Dịch vụ đăng ký cho thuê:</p>
            <p>{formatServices()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
