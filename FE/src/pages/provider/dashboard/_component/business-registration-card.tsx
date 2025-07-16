import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Car, Clock, FileText, MapPin, Phone } from "lucide-react";

export default function BusinessRegistrationCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Thông tin đăng ký kinh doanh
            </h3>
          </div>
          <div className="relative inline-block"></div>
        </div>

        <div className="flex items-center mb-5">
          <Building className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Tên người cho thuê:</p>
            <p>Công ty TNHH Dịch vụ Cho thuê Xe ABC</p>
          </div>
        </div>

        <div className="flex items-center mb-5">
          <MapPin className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Địa chỉ văn phòng:</p>
            <p>Số 123, Đường XYZ, Quận ABC, TP. Hồ Chí Minh</p>
          </div>
        </div>
        <div className="flex items-center mb-5">
          <Phone className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Điện thoại:</p>
            <p>+84 987 654 321</p>
          </div>
        </div>

        <div className="flex items-center mb-5">
          <Clock className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Giờ hoạt động:</p>
            <p>+84 987 654 321</p>
          </div>
        </div>
        <div className="flex items-center">
          <Car className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Dịch vụ đăng ký cho thuê:</p>
            <p>Ô tô</p>
          </div>
        </div>
      </div>
    </div>
  );
}
