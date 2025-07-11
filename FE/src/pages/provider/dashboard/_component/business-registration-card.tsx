import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, FileText, MapPin, Phone } from "lucide-react";

export default function BusinessRegistrationCard() {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Thông tin Đăng ký Kinh doanh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-gray-700">
        <div className="flex items-center">
          <Building className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Tên công ty:</p>
            <p>Công ty TNHH Dịch vụ Cho thuê Xe ABC</p>
          </div>
        </div>
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Mã số thuế:</p>
            <p>0123456789</p>
          </div>
        </div>
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Địa chỉ:</p>
            <p>Số 123, Đường XYZ, Quận ABC, TP. Hồ Chí Minh</p>
          </div>
        </div>
        <div className="flex items-center">
          <Phone className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <p className="font-medium">Điện thoại:</p>
            <p>+84 987 654 321</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
