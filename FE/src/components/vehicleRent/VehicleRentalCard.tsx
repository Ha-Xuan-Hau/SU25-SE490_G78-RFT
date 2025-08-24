"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import moment from "moment";
import { formatCurrency } from "@/lib/format-currency";
import { BookingDetail } from "@/types/booking"; // Import BookingDetail
import ReportButton from "../ReportComponent";

// Ant Design components
import { Button, Card, Tag, Modal } from "antd";
import { CarOutlined, WarningOutlined } from "@ant-design/icons";

// Import modals
import RatingModal from "./RatingModal";
import PaymentModal from "../PaymentModal";
import CancelBookingModal from "../CancelBookingModal";
import ReturnVehicleModal from "./ReturnVehicleModal";
import VehicleSelectionModal from "./VehicleSelectionModal";
import dayjs from "dayjs";

// Import booking APIs
import { updateBookingStatus, cancelBooking } from "@/apis/booking.api";
import { showSuccess, showError } from "@/utils/toast.utils";

// API response type
interface ApiResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

// Sử dụng Vehicle type từ BookingDetail thay vì tự định nghĩa
type Vehicle = BookingDetail["vehicles"][0];

// Định nghĩa interface cho props
interface BookingInfo {
  _id: string;
  vehicleId: {
    _id: string;
    model?: {
      name: string;
    };
    yearManufacture: number;
    vehicleThumb: string;
    vehicleLicensePlate: string;
    vehicleImage: string;
  };
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number;
  status?: string;
  contract?: {
    status: string;
  };
  // Sử dụng Vehicle từ BookingDetail
  vehicles?: Vehicle[];
}

interface VehicleRentalCardProps {
  info: BookingInfo;
  accessToken?: string;
  onOpenRating?: (vehicleId?: string) => void;
  isRated?: boolean;
  currentRatingMap?: Record<string, any>;
}

// Helper function to get status badge styling and text
const getStatusBadge = (status?: string) => {
  let color = "default";
  let text = "Không rõ";

  if (status === "Đã tất toán" || status === "COMPLETED") {
    color = "success";
    text = "Đã hoàn thành";
  } else if (status === "CONFIRMED" || status === "Đã xác nhận") {
    color = "processing";
    text = "Đã xác nhận";
  } else if (status === "Đang thực hiện" || status === "RECEIVED_BY_CUSTOMER") {
    color = "success";
    text = "Đang thuê";
  } else if (
    status === "DELIVERED" ||
    status === "Đang giao xe" ||
    status === "DELIVERING"
  ) {
    color = "warning";
    text = "Xe đã được giao";
  } else if (status === "RETURNED" || status === "Đã trả xe") {
    color = "cyan";
    text = "Đã trả xe";
  } else if (status === "Đã hủy" || status === "CANCELLED") {
    color = "error";
    text = "Đã hủy";
  } else if (status === "Chờ thanh toán" || status === "UNPAID") {
    color = "volcano";
    text = "Chờ thanh toán";
    // } else if (status === "Chờ xử lý" || status === "PENDING") {
    //   color = "orange";
    //   text = "Chờ xử lý";
  } else {
    color = "default";
    text = "Đang chờ";
  }

  return (
    <Tag color={color} className="text-xs px-3 py-1 font-medium">
      {text}
    </Tag>
  );
};

export const VehicleRentalCard: React.FC<VehicleRentalCardProps> = ({
  info,
  accessToken,
  onOpenRating,
  isRated,
  currentRatingMap = {},
}) => {
  const [open, setOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [vehicleId, setCarId] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmReceiveModal, setConfirmReceiveModal] = useState(false);

  const [reportGuideVisible, setReportGuideVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);

  // States for vehicle selection modal
  const [vehicleSelectionModal, setVehicleSelectionModal] = useState(false);

  const showModal = (bookingId: string, vehicleId: string) => {
    setBookingId(bookingId);
    setCarId(vehicleId);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const showPaymentModal = () => {
    setPaymentModalVisible(true);
  };

  const hidePaymentModal = () => {
    setPaymentModalVisible(false);
  };

  const handlePaymentSuccess = () => {
    window.location.reload();
  };

  // Handle customer receiving the vehicle
  const handleReceiveVehicle = async () => {
    try {
      setLoading(true);
      const result = (await updateBookingStatus(
        info._id,
        "receive"
      )) as ApiResponse;

      if (result.success) {
        showSuccess("Đã xác nhận nhận xe thành công!");
        window.location.reload();
      } else {
        showError(result.error || "Có lỗi xảy ra khi xác nhận nhận xe");
      }
    } catch (error) {
      //console.error("Error receiving vehicle:", error);
      showError("Có lỗi xảy ra khi xác nhận nhận xe");
    } finally {
      setLoading(false);
      setConfirmReceiveModal(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (reason: string) => {
    try {
      setLoading(true);
      const result = (await cancelBooking(
        info._id,
        reason,
        "customer"
      )) as ApiResponse;

      if (result.success) {
        showSuccess("Đã hủy đơn đặt xe thành công!");
        setCancelModalVisible(false);
        window.location.reload();
      } else {
        showError(result.error || "Có lỗi xảy ra khi hủy đơn");
      }
    } catch (error) {
      //console.error("Error canceling booking:", error);
      showError("Có lỗi xảy ra khi hủy đơn");
    } finally {
      setLoading(false);
    }
  };

  const showCancelModal = () => {
    setCancelModalVisible(true);
  };

  const hideCancelModal = () => {
    setCancelModalVisible(false);
  };

  // Handle vehicle return
  const handleReturnVehicle = async () => {
    try {
      setLoading(true);
      const result = (await updateBookingStatus(
        info._id,
        "return"
      )) as ApiResponse;

      if (result.success) {
        showSuccess("Đã xác nhận trả xe thành công!");
        setReturnModalVisible(false);
        window.location.reload();
      } else {
        showError(result.error || "Có lỗi xảy ra khi trả xe");
      }
    } catch (error) {
      //console.error("Error returning vehicle:", error);
      showError("Có lỗi xảy ra khi trả xe");
    } finally {
      setLoading(false);
    }
  };

  const showReturnModal = () => {
    setReturnModalVisible(true);
  };

  const hideReturnModal = () => {
    setReturnModalVisible(false);
  };

  // Handle rating button click
  const handleRatingClick = () => {
    // Nếu có vehicles từ booking detail và có nhiều hơn 1 xe
    if (info.vehicles && info.vehicles.length > 1) {
      setVehicleSelectionModal(true);
    } else {
      // Trường hợp 1 xe hoặc không có vehicles data, dùng logic cũ
      const vehicleId = info.vehicles?.[0]?.id || info.vehicleId._id; // Sử dụng id
      onOpenRating?.(vehicleId);
    }
  };

  // Handle vehicle selection for rating
  const handleSelectVehicleForRating = (vehicle: Vehicle) => {
    setVehicleSelectionModal(false);
    onOpenRating?.(vehicle.id); // Sử dụng id
  };

  // Check functions
  const isUnpaid = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;
    return (
      contractStatus === "Chờ thanh toán" ||
      bookingStatus === "Chờ thanh toán" ||
      contractStatus === "WAITING_PAYMENT" ||
      bookingStatus === "UNPAID"
    );
  };

  const isDelivered = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;
    return (
      contractStatus === "DELIVERED" ||
      bookingStatus === "DELIVERED" ||
      contractStatus === "Đang giao xe" ||
      bookingStatus === "Đang giao xe"
    );
  };

  const canReturn = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;
    return (
      contractStatus === "RECEIVED_BY_CUSTOMER" ||
      bookingStatus === "RECEIVED_BY_CUSTOMER" ||
      contractStatus === "Đang thực hiện" ||
      bookingStatus === "Đang thực hiện"
    );
  };

  const canCancel = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;
    const prohibitedStatuses = [
      "RECEIVED_BY_CUSTOMER",
      "Đang thực hiện",
      "COMPLETED",
      "Đã tất toán",
      "RETURNED",
      "Đã trả xe",
      "CANCELLED",
      "Đã hủy",
    ];
    return (
      !prohibitedStatuses.includes(contractStatus || "") &&
      !prohibitedStatuses.includes(bookingStatus || "")
    );
  };

  // Check if can rate
  const canRate = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;
    const completedStatuses = [
      "COMPLETED",
      "Đã tất toán",
      "RETURNED",
      "Đã trả xe",
    ];

    return (
      completedStatuses.includes(contractStatus || "") ||
      completedStatuses.includes(bookingStatus || "")
    );
  };

  // Check if any vehicle is rated (for display purpose)
  const hasAnyRating = () => {
    if (!info.vehicles || info.vehicles.length === 0) {
      // Fallback to booking-level rating
      const ratingKey = `${info._id}_${info.vehicleId._id}`;
      return currentRatingMap[ratingKey];
    }

    return info.vehicles.some((vehicle) => {
      const ratingKey = `${info._id}_${vehicle.id}`;
      return currentRatingMap[ratingKey];
    });
  };

  // Calculate rental duration
  // Calculate rental duration với logic giống utils
  const startDate = dayjs(info?.timeBookingStart);
  const endDate = dayjs(info?.timeBookingEnd);

  const totalHours = endDate.diff(startDate, "hour", true); // true để lấy số thập phân
  const totalMinutes = endDate.diff(startDate, "minute");

  let durationText = "";

  // Logic tính toán theo quy tắc của utils
  if (totalHours <= 8) {
    // Tính theo giờ + phút (≤ 8 giờ)
    const hours = Math.floor(totalHours);
    const minutes = Math.round(totalMinutes % 60);

    if (minutes > 0) {
      durationText = `${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      durationText = `${hours} giờ`;
    } else {
      durationText = "Dưới 1 giờ";
    }
  } else {
    // Tính theo ngày (> 8 giờ)
    let billingDays;

    if (totalHours <= 24) {
      // > 8 giờ nhưng ≤ 24 giờ = 1 ngày
      billingDays = 1;
    } else {
      // > 24 giờ = làm tròn lên ngày
      billingDays = Math.ceil(totalHours / 24);
    }

    durationText = `${billingDays} ngày`;
  }

  // Kiểm tra có thể báo cáo không và loại báo cáo nào
  const canReport = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;

    const reportableStatuses = [
      "CONFIRMED",
      "Đã xác nhận",
      "DELIVERED",
      "Đang giao xe",
      "DELIVERING",
      "RECEIVED_BY_CUSTOMER",
      "Đang thực hiện",
      "RETURNED",
      "Đã trả xe",
      "COMPLETED",
      "Đã tất toán",
      "CANCELLED",
      "Đã hủy",
    ];

    return (
      reportableStatuses.includes(contractStatus || "") ||
      reportableStatuses.includes(bookingStatus || "")
    );
  };

  // Lấy danh sách loại báo cáo theo trạng thái
  const getReportTypes = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;

    // Trạng thái CONFIRMED, DELIVERED - vấn đề khi nhận xe
    if (
      contractStatus === "CONFIRMED" ||
      bookingStatus === "CONFIRMED" ||
      contractStatus === "Đã xác nhận" ||
      bookingStatus === "Đã xác nhận" ||
      contractStatus === "DELIVERED" ||
      bookingStatus === "DELIVERED" ||
      contractStatus === "Đang giao xe" ||
      bookingStatus === "Đang giao xe" ||
      contractStatus === "DELIVERING" ||
      bookingStatus === "DELIVERING"
    ) {
      return ["MISLEADING_INFO", "FRAUD", "DOCUMENT_ISSUE"];
    }

    // Trạng thái RECEIVED_BY_CUSTOMER, RETURNED, COMPLETED - vấn đề sau khi thuê
    if (
      contractStatus === "RECEIVED_BY_CUSTOMER" ||
      bookingStatus === "RECEIVED_BY_CUSTOMER" ||
      contractStatus === "Đang thực hiện" ||
      bookingStatus === "Đang thực hiện" ||
      contractStatus === "RETURNED" ||
      bookingStatus === "RETURNED" ||
      contractStatus === "Đã trả xe" ||
      bookingStatus === "Đã trả xe" ||
      contractStatus === "COMPLETED" ||
      bookingStatus === "COMPLETED" ||
      contractStatus === "Đã tất toán" ||
      bookingStatus === "Đã tất toán"
    ) {
      return [
        "TECHNICAL_ISSUE",
        "UNSAFE_VEHICLE",
        "FUEL_LEVEL_INCORRECT",
        "EXPIRED_INSURANCE",
        "NO_INSURANCE",
        "DOCUMENT_ISSUE",
      ];
    }

    // Đã hủy
    if (
      contractStatus === "CANCELLED" ||
      bookingStatus === "CANCELLED" ||
      contractStatus === "Đã hủy" ||
      bookingStatus === "Đã hủy"
    ) {
      return ["FRAUD"]; // Chỉ báo cáo lừa đảo cho đơn đã hủy
    }

    return [];
  };

  const getReportPhase = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;
    const status = contractStatus || bookingStatus;

    if (status === "CANCELLED" || status === "Đã hủy") {
      return "cancelled";
    }

    if (
      status === "CONFIRMED" ||
      status === "Đã xác nhận" ||
      status === "DELIVERED" ||
      status === "Đang giao xe" ||
      status === "DELIVERING"
    ) {
      return "handover";
    }

    if (
      status === "RECEIVED_BY_CUSTOMER" ||
      status === "Đang thực hiện" ||
      status === "RETURNED" ||
      status === "Đã trả xe" ||
      status === "COMPLETED" ||
      status === "Đã tất toán"
    ) {
      return "rental";
    }

    return "other";
  };

  // Handler cho nút báo cáo
  const handleReportClick = () => {
    const reportTypes = getReportTypes();
    setSelectedReportTypes(reportTypes);
    setReportGuideVisible(true);
  };

  // Handler khi đồng ý báo cáo
  const handleAgreeReport = () => {
    setReportGuideVisible(false);
    setReportModalVisible(true);
  };

  // Handler khi đóng modal báo cáo
  const handleReportModalClose = () => {
    setReportModalVisible(false);
    setSelectedReportTypes([]);
  };

  // Lấy nội dung hướng dẫn
  const getGuideContent = () => {
    const phase = getReportPhase();

    if (phase === "handover") {
      return {
        title: "Hướng dẫn báo cáo vấn đề khi giao nhận xe",
        description:
          "Bạn đang trong giai đoạn giao nhận xe. Các vấn đề có thể báo cáo:",
        issues: [
          "🚗 Xe khác với mô tả (biển số, màu sắc, mẫu xe không đúng)",
          "⚠️ Chủ xe lừa đảo (thay đổi địa điểm, thời gian, không giao xe)",
          "📄 Vấn đề về giấy tờ xe (thiếu hoặc không hợp lệ)",
        ],
      };
    } else if (phase === "rental") {
      return {
        title: "Hướng dẫn báo cáo vấn đề trong quá trình thuê xe",
        description:
          "Bạn đã nhận xe và đang trong quá trình sử dụng. Các vấn đề có thể báo cáo:",
        issues: [
          "🔧 Xe gặp lỗi kỹ thuật (chết máy, hỏng hóc)",
          "⚠️ Xe không an toàn (phanh hỏng, đèn không hoạt động)",
          "⛽ Mức nhiên liệu không đúng cam kết",
          "📋 Vấn đề bảo hiểm (hết hạn hoặc không có)",
          "📄 Giấy tờ xe không hợp lệ",
          "⚠️ Chủ xe lừa đảo (Không minh bạch trong giao dịch)",
        ],
      };
    } else if (phase === "cancelled") {
      return {
        title: "Hướng dẫn báo cáo vấn đề sau quá trình hủy đơn",
        description: "Đơn đã bị hủy và có thể báo cáo các vấn đề liên quan:",
        issues: ["⚠️ Chủ xe lừa đảo (Không minh bạch trong giao dịch)"],
      };
    }

    return null;
  };

  // Kiểm tra có nhiều loại báo cáo không
  const hasMultipleReportTypes = () => {
    return getReportTypes().length > 1;
  };

  return (
    <>
      <Card
        className="w-full shadow-md hover:shadow-lg transition-all duration-300 border-0"
        bodyStyle={{ padding: "20px" }}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ảnh xe - kích thước nhỏ hơn */}
          <div className="flex-shrink-0 w-full lg:w-48 h-36 relative rounded-lg overflow-hidden">
            <Image
              src={
                info?.vehicleId?.vehicleImage ||
                "/placeholder.svg?height=144&width=192"
              }
              alt={info?.vehicleId?.model?.name || "Car image"}
              fill
              sizes="(max-width: 1024px) 100vw, 192px"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Thông tin chi tiết */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Header - Booking ID và Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold text-gray-600">
                  Mã đặt xe: {info._id}
                </span>
                {getStatusBadge(info?.contract?.status || info?.status)}
              </div>

              {/* Tên xe và biển số */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {info?.vehicleId?.vehicleThumb || "Tên xe"}
                  {info.vehicles && info.vehicles.length > 1 && (
                    <span className="text-sm text-gray-500 ml-2">
                      (+{info.vehicles.length - 1} xe khác)
                    </span>
                  )}
                </h3>
                <p className="text-gray-600">
                  Biển số: {info?.vehicleId?.vehicleLicensePlate}
                </p>
              </div>

              {/* Giá và thời gian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(info?.totalCost)}
                  </div>
                  <div className="text-sm text-gray-500">Tổng chi phí</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {durationText}
                  </div>
                  <div className="text-xs text-gray-500">Thời gian thuê</div>
                </div>
              </div>

              {/* Thời gian chi tiết */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Bắt đầu:</span>
                    <div className="font-medium">
                      {moment(info?.timeBookingStart).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Kết thúc:</span>
                    <div className="font-medium">
                      {moment(info?.timeBookingEnd).format("DD/MM/YYYY HH:mm")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút hành động - tất cả nằm cùng hàng */}
            <div className="flex flex-wrap gap-2 mt-4 justify-end">
              {/* Nút thanh toán */}
              {isUnpaid() && (
                <Button
                  type="primary"
                  onClick={showPaymentModal}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Thanh toán
                </Button>
              )}

              {/* Nút nhận xe */}
              {isDelivered() && (
                <Button
                  type="primary"
                  onClick={() => setConfirmReceiveModal(true)}
                  loading={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Nhận xe
                </Button>
              )}

              {/* Nút trả xe */}
              {canReturn() && (
                <Button
                  type="primary"
                  onClick={showReturnModal}
                  loading={loading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Trả xe
                </Button>
              )}

              {/* Nút hủy */}
              {canCancel() && (
                <Button danger onClick={showCancelModal} loading={loading}>
                  Hủy đơn
                </Button>
              )}

              {/* Nút báo cáo */}
              {canReport() && (
                <Button
                  type="default"
                  onClick={handleReportClick}
                  className="border-red-400 text-red-600 hover:bg-red-50"
                  icon={<WarningOutlined />}
                >
                  Báo cáo
                </Button>
              )}

              {/* Nút đánh giá */}
              {canRate() && onOpenRating && (
                <Button
                  type="default"
                  onClick={handleRatingClick}
                  className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                >
                  {hasAnyRating() ? "Đánh giá lại" : "Đánh giá"}
                </Button>
              )}

              {/* Nút chi tiết */}
              <Link
                href={`/booking-detail/${info?._id}`}
                passHref
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="default">Chi tiết</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Vehicle Selection Modal */}
      {info.vehicles && (
        <VehicleSelectionModal
          open={vehicleSelectionModal}
          onCancel={() => setVehicleSelectionModal(false)}
          vehicles={info.vehicles} // Use info.vehicles instead
          onSelectVehicle={handleSelectVehicleForRating}
          currentRatingMap={currentRatingMap}
          bookingId={info._id} // Use info._id for bookingId
        />
      )}

      {/* Modal xác nhận nhận xe */}
      <Modal
        title="Xác nhận nhận xe"
        open={confirmReceiveModal}
        onCancel={() => setConfirmReceiveModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmReceiveModal(false)}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loading}
            onClick={handleReceiveVehicle}
            className="bg-green-500 hover:bg-green-600"
          >
            Xác nhận nhận xe
          </Button>,
        ]}
        width={500}
        centered
      >
        <div className="py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg">
                {info?.vehicleId?.vehicleThumb}
              </h4>
              <p className="text-gray-600">
                Biển số: {info?.vehicleId?.vehicleLicensePlate}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ tình trạng xe trước
              khi xác nhận nhận xe. Sau khi xác nhận, bạn sẽ chịu trách nhiệm về
              xe trong suốt thời gian thuê.
            </p>
          </div>

          <p className="text-gray-700">
            Bạn có chắc chắn đã nhận được xe và muốn xác nhận không?
          </p>
        </div>
      </Modal>

      {/* Các modal khác */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={hidePaymentModal}
        booking={{
          _id: info._id,
          totalCost: info.totalCost,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <CancelBookingModal
        visible={cancelModalVisible}
        onCancel={hideCancelModal}
        onConfirm={handleCancelBooking}
        bookingId={info._id}
        userType="customer"
        loading={loading}
      />

      <ReturnVehicleModal
        visible={returnModalVisible}
        onCancel={hideReturnModal}
        onConfirm={handleReturnVehicle}
        loading={loading}
        vehicleInfo={{
          bookingId: info._id,
          vehicleThumb:
            info?.vehicleId?.vehicleThumb ||
            info?.vehicleId?.model?.name ||
            "Không xác định",
          licensePlate:
            info?.vehicleId?.vehicleLicensePlate || "Không xác định",
        }}
      />
      {/* Modal hướng dẫn báo cáo */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <WarningOutlined className="text-red-500" />
            <span>Hướng dẫn báo cáo</span>
          </div>
        }
        open={reportGuideVisible}
        onCancel={() => setReportGuideVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setReportGuideVisible(false)}>
            Đóng
          </Button>,
          <Button key="agree" type="primary" danger onClick={handleAgreeReport}>
            Đồng ý báo cáo
          </Button>,
        ]}
      >
        {getGuideContent() && (
          <div className="py-4">
            {/* Thông báo cảnh báo */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <WarningOutlined className="text-yellow-600 mt-1" />
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">Lưu ý quan trọng:</div>
                  <p>
                    Vui lòng chỉ báo cáo khi thực sự gặp vấn đề. Báo cáo sai sự
                    thật có thể dẫn đến việc tài khoản bị hạn chế.
                  </p>
                </div>
              </div>
            </div>

            {/* Nội dung hướng dẫn */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3">
                {getGuideContent()?.title}
              </h4>
              <p className="text-gray-600 mb-4">
                {getGuideContent()?.description}
              </p>

              <div className="space-y-2">
                {getGuideContent()?.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thông tin xe */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CarOutlined className="text-blue-600" />
                <span className="font-medium">Thông tin xe báo cáo:</span>
              </div>
              <div className="text-sm text-gray-700">
                <div>
                  <strong>Tên xe:</strong> {info?.vehicleId?.vehicleThumb}
                </div>
                <div>
                  <strong>Biển số:</strong>{" "}
                  {info?.vehicleId?.vehicleLicensePlate}
                </div>
                <div>
                  <strong>Mã đặt xe:</strong> {info._id}
                </div>
              </div>
            </div>

            {/* Quy trình xử lý */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">Quy trình xử lý báo cáo:</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Báo cáo sẽ được gửi đến bộ phận hỗ trợ khách hàng</li>
                  <li>
                    Chúng tôi sẽ liên hệ xác minh thông tin trong thời gian sớm
                    nhất
                  </li>
                  <li>
                    Tùy theo mức độ nghiêm trọng, sẽ có biện pháp xử lý phù hợp
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Thay vì dùng display: none */}
      {reportModalVisible &&
        selectedReportTypes.length > 0 &&
        (selectedReportTypes.length === 1 ? (
          <ReportButton
            targetId={info.vehicleId._id}
            reportType={selectedReportTypes[0]}
            booking={info._id}
            buttonText=""
            size="small"
            type="text"
            icon={false}
            autoOpen={true}
            onModalClose={handleReportModalClose}
          />
        ) : (
          <ReportButton
            targetId={info.vehicleId._id}
            reportTypes={selectedReportTypes}
            booking={info._id}
            showTypeSelector={true}
            buttonText=""
            size="small"
            type="text"
            icon={false}
            autoOpen={true}
            onModalClose={handleReportModalClose}
          />
        ))}
    </>
  );
};

export default VehicleRentalCard;
