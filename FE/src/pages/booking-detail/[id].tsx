import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Divider, Card, Tag, Spin, Alert } from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatCurrency } from "@/lib/format-currency";
import { getBookingDetail } from "@/apis/booking.api";
import { BookingDetail } from "@/types/booking";
import { translateENtoVI } from "@/lib/viDictionary";

export default function BookingDetailPage() {
  const router = useRouter();
  const bookingId = router.query.id as string;
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getBookingDetail(bookingId);
        setData(res as BookingDetail);
      } catch (err) {
        setError("Không thể tải thông tin đơn đặt xe");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookingId]);

  const formatDateTime = (dateValue: string | number[]) => {
    if (Array.isArray(dateValue)) {
      return moment({
        year: dateValue[0],
        month: dateValue[1] - 1,
        day: dateValue[2],
        hour: dateValue[3],
        minute: dateValue[4],
        second: dateValue[5] || 0,
      }).format("DD/MM/YYYY HH:mm");
    }
    return dateValue ? moment(dateValue).format("DD/MM/YYYY HH:mm") : "";
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      PENDING: "orange",
      CONFIRMED: "blue",
      IN_PROGRESS: "purple",
      COMPLETED: "green",
      CANCELLED: "red",
    };
    return statusColors[status] || "default";
  };

  // Function để render thông tin theo trạng thái
  const renderStatusSpecificInfo = () => {
    const status = data?.status;

    if (status === "COMPLETED") {
      return (
        <>
          {/* Chi tiết thời gian - */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Có thuê tài xế:</span>
              <span className="font-mono font-medium">
                {data?.driverFee ? "Có" : "Không"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Ngày nhận xe:</span>
              <span className="font-medium text-blue-600">
                {formatDateTime(data?.timeBookingStart || "")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Ngày trả xe:</span>
              <span className="font-medium text-blue-600">
                {formatDateTime(data?.timeBookingEnd || "")}
              </span>
            </div>

            {/* Thời gian trả xe thực tế */}
            {data?.returnedAt && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Thời gian trả xe thực tế:</span>
                <span className="font-medium text-green-600">
                  {formatDateTime(data.returnedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          {data?.note && (
            <div className="mt-4">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                <InfoCircleOutlined className="text-blue-500" />
                Ghi chú từ chủ xe
              </h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <span className="text-gray-700">{data.note}</span>
              </div>
            </div>
          )}

          <Divider />

          {/* Tổng giá thuê cho đơn hoàn thành */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <CheckCircleOutlined className="text-green-500" />
                Tổng giá thuê:
              </h3>
              <h3 className="text-2xl font-bold text-green-600">
                {data?.totalCost ? formatCurrency(data.totalCost) : "0 ₫"}
              </h3>
            </div>
          </div>
        </>
      );
    }

    if (status === "CANCELLED") {
      return (
        <>
          {/* Lý do hủy đơn */}
          {data?.note && (
            <div className="mt-4">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                <CloseCircleOutlined className="text-red-500" />
                Lý do hủy đơn
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <span className="text-red-700">{data.note}</span>
              </div>
            </div>
          )}
        </>
      );
    }

    // Các trạng thái khác (PENDING, CONFIRMED, IN_PROGRESS)
    return (
      <>
        {/* Địa điểm giao xe */}
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
            <EnvironmentOutlined className="text-green-500" />
            Địa điểm giao xe
          </h4>
          <div className="bg-green-50 rounded-lg p-4">
            <span className="text-gray-700">{data?.address}</span>
          </div>
        </div>

        <Divider />

        {/* Chi tiết thời gian */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Có thuê tài xế:</span>
            <span className="font-mono font-medium">
              {data?.driverFee ? "Có" : "Không"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Ngày nhận xe:</span>
            <span className="font-medium text-blue-600">
              {formatDateTime(data?.timeBookingStart || "")}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Ngày trả xe:</span>
            <span className="font-medium text-blue-600">
              {formatDateTime(data?.timeBookingEnd || "")}
            </span>
          </div>
        </div>

        <Divider />

        {/* Tổng giá thuê cho các trạng thái khác */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <InfoCircleOutlined className="text-green-500" />
              Tổng giá thuê:
            </h3>
            <h3 className="text-2xl font-bold text-green-600">
              {data?.totalCost ? formatCurrency(data.totalCost) : "0 ₫"}
            </h3>
          </div>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải thông tin..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          // action={
          //   <button
          //     onClick={() => router.back()}
          //     className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          //   >
          //     Quay lại
          //   </button>
          // }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chi tiết đơn đặt xe
          </h1>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Tag
              color={getStatusColor(data?.status || "")}
              className="text-lg px-4 py-2 font-semibold rounded-full border-2"
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {translateENtoVI(data?.status || "")}
            </Tag>
            <span className="text-gray-500 text-lg font-medium">
              Mã thanh toán: {data?.codeTransaction}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Thông tin xe thuê */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <CarOutlined className="text-blue-500" />
                <span>
                  Thông tin xe thuê ({data?.vehicles?.length || 0} xe)
                </span>
              </div>
            }
            className="shadow-lg"
          >
            <div className="space-y-4">
              {data?.vehicles?.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() =>
                    window.open(`/vehicles/${vehicle.id}`, "_blank")
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">
                          {vehicle.thumb}
                        </h4>
                        <p className="text-gray-600">
                          <Tag color="blue">
                            {translateENtoVI(vehicle.vehicleTypes)}
                          </Tag>
                        </p>
                        <p className="text-sm text-gray-500">
                          Biển số:{" "}
                          <span className="font-mono font-medium">
                            {vehicle.licensePlate}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Chủ xe: {vehicle.user.fullName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(vehicle.costPerDay)}/ngày
                      </div>
                      <Tag
                        color={vehicle.status === "AVAILABLE" ? "green" : "red"}
                        className="mt-1"
                      >
                        {vehicle.status === "AVAILABLE"
                          ? "Đang hoạt động"
                          : "Không hoạt động"}
                      </Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Thông tin đặt xe */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-green-500" />
                <span>Thông tin đặt xe</span>
              </div>
            }
            className="shadow-lg"
          >
            <div className="space-y-6">
              {/* Thông tin khách hàng */}
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                  <UserOutlined className="text-blue-500" />
                  Thông tin khách hàng
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400" />
                    <span className="font-medium">{data?.user?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneOutlined className="text-gray-400" />
                    <span>{data?.phoneNumber}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <EnvironmentOutlined className="text-gray-400 mt-1" />
                    <span className="text-sm">{data?.user?.address}</span>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Chi tiết đơn hàng cơ bản - luôn hiển thị */}
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                  <CalendarOutlined className="text-orange-500" />
                  Chi tiết đơn hàng
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-mono font-medium">{data?.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Ngày tạo đơn:</span>
                    <span className="font-medium">
                      {formatDateTime(data?.createdAt || "")}
                    </span>
                  </div>
                  {/* Dòng Hình phạt áp dụng */}
                  {data?.penaltyType &&
                    data?.penaltyValue !== undefined &&
                    data?.minCancelHour !== undefined && (
                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                        <span className="text-gray-600 whitespace-nowrap">
                          Hình phạt áp dụng:
                        </span>
                        <span className="text-sm text-right text-red-600 font-medium ml-4">
                          {(() => {
                            if (data.penaltyType === "PERCENT") {
                              return `Phí phạt ${data.penaltyValue}% giá trị đơn hàng áp dụng khi hủy đơn trong vòng ${data.minCancelHour} giờ trước giờ nhận xe`;
                            } else {
                              return `Phí phạt cố định ${formatCurrency(
                                data.penaltyValue
                              )} áp dụng khi hủy đơn trong vòng ${
                                data.minCancelHour
                              } giờ trước giờ nhận xe`;
                            }
                          })()}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* Render thông tin theo trạng thái (sẽ không hiển thị thêm gì nếu là CANCELLED) */}
              {renderStatusSpecificInfo()}
            </div>
          </Card>
        </div>

        {/* Back button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
