"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import moment from "moment";
import { formatCurrency } from "@/lib/format-currency"; // Assuming this utility exists

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Lucide React icons
import { CalendarDaysIcon } from "lucide-react";

// Import modals
import RatingModal from "./RatingModal";
import PaymentModal from "./PaymentModal";
import CancelBookingModal from "./CancelBookingModal";
import ReturnVehicleModal from "./ReturnVehicleModal";

// Import booking APIs
import { updateBookingStatus, cancelBooking } from "@/apis/booking.api";
import { showSuccess, showError } from "@/utils/toast.utils";

// API response type
interface ApiResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

// Định nghĩa interface cho props
interface BookingInfo {
  _id: string;
  carId: {
    _id: string;
    model?: {
      name: string;
    };
    yearManufacture: number;
    thumb: string;
    // Thêm các thông tin khác của xe nếu có, ví dụ:
    // transmission?: string; // Tự động/Số sàn
    // seats?: number; // Số chỗ
    // fuelType?: string; // Xăng/Dầu/Điện
  };
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number;
  status?: string; // Có thể dùng cho trạng thái tổng quát của booking
  contract?: {
    status: string; // Trạng thái chi tiết của hợp đồng
  };
}

interface VehicleRentalCardProps {
  info: BookingInfo;
  accessToken?: string;
}

// Helper function to get status badge styling and text
const getStatusBadge = (status?: string) => {
  let variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | null = null;
  let text = "Không rõ";
  let customClass = "";

  if (status === "Đã tất toán" || status === "COMPLETED") {
    variant = "default";
    text = "Đã hoàn thành";
    customClass = "bg-emerald-500 text-white hover:bg-emerald-500/80"; // Emerald like completed tab
  } else if (status === "CONFIRMED" || status === "Đã xác nhận") {
    variant = "default";
    text = "Đã xác nhận";
    customClass = "bg-orange-500 text-white hover:bg-orange-500/80"; // Orange like processing tab
  } else if (status === "Đang thực hiện" || status === "RECEIVED_BY_CUSTOMER") {
    variant = "default";
    text = "Đang thuê";
    customClass = "bg-green-500 text-white hover:bg-green-500/80"; // Green like active tab
  } else if (
    status === "DELIVERED" ||
    status === "Đang giao xe" ||
    status === "DELIVERING"
  ) {
    variant = "default";
    text = "Xe đã được giao";
    customClass = "bg-yellow-500 text-white hover:bg-yellow-500/80"; // Yellow like transporting tab
  } else if (status === "RETURNED" || status === "Đã trả xe") {
    variant = "default";
    text = "Đã trả xe";
    customClass = "bg-blue-500 text-white hover:bg-blue-500/80"; // Blue like returned tab
  } else if (status === "Đã hủy" || status === "CANCELLED") {
    variant = "destructive";
    text = "Đã hủy";
    customClass = "bg-red-500 text-white hover:bg-red-500/80"; // Red like cancelled tab
  } else if (status === "Chờ thanh toán" || status === "UNPAID") {
    variant = "default";
    text = "Chờ thanh toán";
    customClass = "bg-red-500 text-white hover:bg-red-500/80"; // Red like payment tab
  } else if (status === "Chờ xử lý" || status === "PENDING") {
    variant = "default";
    text = "Chờ xử lý";
    customClass = "bg-orange-500 text-white hover:bg-orange-500/80"; // Orange like processing tab
  } else {
    variant = "secondary";
    text = "Đang chờ";
  }

  return (
    <Badge
      variant={variant}
      className={`rounded-full text-xs px-3 py-1 font-medium ${customClass}`}
    >
      {text}
    </Badge>
  );
};

export const VehicleRentalCard: React.FC<VehicleRentalCardProps> = ({
  info,
  accessToken,
}) => {
  const [open, setOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [carId, setCarId] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const showModal = (bookingId: string, carId: string) => {
    setBookingId(bookingId);
    setCarId(carId);
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
    // Refresh the page or update the booking status
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
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        showError(result.error || "Có lỗi xảy ra khi xác nhận nhận xe");
      }
    } catch (error) {
      console.error("Error receiving vehicle:", error);
      showError("Có lỗi xảy ra khi xác nhận nhận xe");
    } finally {
      setLoading(false);
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
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        showError(result.error || "Có lỗi xảy ra khi hủy đơn");
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      showError("Có lỗi xảy ra khi hủy đơn");
    } finally {
      setLoading(false);
    }
  };

  // Show cancel modal
  const showCancelModal = () => {
    setCancelModalVisible(true);
  };

  // Hide cancel modal
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
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        showError(result.error || "Có lỗi xảy ra khi trả xe");
      }
    } catch (error) {
      console.error("Error returning vehicle:", error);
      showError("Có lỗi xảy ra khi trả xe");
    } finally {
      setLoading(false);
    }
  };

  // Show return modal
  const showReturnModal = () => {
    setReturnModalVisible(true);
  };

  // Hide return modal
  const hideReturnModal = () => {
    setReturnModalVisible(false);
  };

  // Check if booking is unpaid/waiting payment
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

  // Check if booking is delivered and waiting for customer to receive
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

  // Check if customer has received the vehicle and can return it
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

  // Check if cancellation is allowed (before RECEIVED_BY_CUSTOMER)
  const canCancel = () => {
    const contractStatus = info?.contract?.status;
    const bookingStatus = info?.status;

    // Cannot cancel if already received by customer, completed, or already cancelled
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

    // Allow cancellation for: UNPAID, PENDING, CONFIRMED, DELIVERING, DELIVERED
    return (
      !prohibitedStatuses.includes(contractStatus || "") &&
      !prohibitedStatuses.includes(bookingStatus || "")
    );
  };

  // Calculate rental duration
  const startDate = moment(info?.timeBookingStart);
  const endDate = moment(info?.timeBookingEnd);
  const durationDays = endDate.diff(startDate, "days");
  const durationText =
    durationDays > 0 ? `${durationDays} ngày` : "Dưới 1 ngày";

  return (
    <Card className="w-full max-w-3xl hover:shadow-lg transition-shadow duration-200">
      <CardContent className="flex flex-col md:flex-row items-start p-4 gap-4">
        {/* Ảnh xe */}
        <div className="flex-shrink-0 w-full md:w-48 h-32 relative rounded-lg overflow-hidden">
          <Image
            src={info?.carId?.thumb || "/placeholder.svg?height=128&width=192"}
            alt={info?.carId?.model?.name || "Car image"}
            fill
            sizes="(max-width: 768px) 100vw, 192px" // Responsive sizes
            className="object-cover rounded-lg"
          />
        </div>

        {/* Thông tin chi tiết xe và booking */}
        <div className="flex-1 grid gap-2 w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {info?.carId?.model?.name || "Unknown Model"}{" "}
                {info?.carId?.yearManufacture || "N/A"}
              </h3>
              {/* Thêm biển số xe nếu có */}
              {/* <p className="text-sm text-gray-500">Biển số: 51A-12345</p> */}
              {/* Thêm các thông số khác của xe nếu có */}
              {/* <div className="flex items-center text-sm text-gray-600 gap-2 mt-1">
                  <CarIcon className="w-4 h-4" /> {info.carId.transmission} | {info.carId.seats} chỗ | {info.carId.fuelType}
                </div> */}
            </div>
            <div className="flex-shrink-0 ml-4">
              {getStatusBadge(info?.contract?.status || info?.status)}
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary">
              {formatCurrency(info?.totalCost)}
            </span>
            <span className="text-sm text-gray-600">/chuyến</span>{" "}
            {/* Assuming totalCost is for the whole trip */}
          </div>

          <div className="text-sm text-gray-700 flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
            <span>
              {moment(info?.timeBookingStart).format("DD-MM-YYYY HH:mm")} -{" "}
              {moment(info?.timeBookingEnd).format("DD-MM-YYYY HH:mm")} (
              {durationText})
            </span>
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-2 mt-2">
            {/* Nút đánh giá cho booking đã hoàn thành - hiển thị cuối cùng bên phải */}
            {info?.contract?.status === "Đã tất toán" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => showModal(info._id, info.carId._id)}
              >
                Đánh giá
              </Button>
            )}
            {/* Nút hủy cho booking có thể hủy */}
            {canCancel() && (
              <Button
                variant="destructive"
                size="sm"
                onClick={showCancelModal}
                disabled={loading}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Hủy
              </Button>
            )}

            {/* Nút "Nhận xe" cho booking đã được giao */}
            {isDelivered() && (
              <Button
                variant="default"
                size="sm"
                onClick={handleReceiveVehicle}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Nhận xe"}
              </Button>
            )}

            {/* Nút "Trả xe" cho booking đã được khách nhận */}
            {canReturn() && (
              <Button
                variant="default"
                size="sm"
                onClick={showReturnModal}
                disabled={loading}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {loading ? "Đang xử lý..." : "Trả xe"}
              </Button>
            )}

            {/* Nút thanh toán cho booking chưa thanh toán */}
            {isUnpaid() && (
              <Button variant="default" size="sm" onClick={showPaymentModal}>
                Thanh toán
              </Button>
            )}

            {/* Nút chi tiết - luôn hiển thị cuối cùng bên phải */}
            <Link href={`/profile/booking-detail/${info?._id}`} passHref>
              <Button variant="outline" size="sm">
                Chi tiết
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>

      {/* Rating Modal */}
      <RatingModal
        open={open}
        handleCancel={handleCancel}
        bookingId={bookingId}
        carId={carId}
        accessToken={accessToken}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={hidePaymentModal}
        booking={{
          _id: info._id,
          totalCost: info.totalCost,
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        visible={cancelModalVisible}
        onCancel={hideCancelModal}
        onConfirm={handleCancelBooking}
        bookingId={info._id}
        userType="customer"
        loading={loading}
      />

      {/* Return Vehicle Modal */}
      <ReturnVehicleModal
        visible={returnModalVisible}
        onCancel={hideReturnModal}
        onConfirm={handleReturnVehicle}
        loading={loading}
        vehicleInfo={{
          licensePlate: info?.carId?.model?.name?.split(" - ")[1] || "N/A",
          model: info?.carId?.model?.name || "Không xác định",
        }}
      />
    </Card>
  );
};

export default VehicleRentalCard;

// Custom Badge variants for Shadcn UI (add these to components/ui/badge.tsx)
// You might need to extend your badge component or add these styles to globals.css
// For simplicity, I'm showing how they would map to Tailwind classes.
// If you want to add custom variants to shadcn/ui, you'd modify badge.tsx and ui/variants.ts
// For this example, I'll assume these are handled by default or via custom classes.
// Example of how to add custom variants in components/ui/badge.tsx:
/*
  import { cva, type VariantProps } from "class-variance-authority"

  const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
      variants: {
        variant: {
          default:
            "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
          secondary:
            "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          destructive:
            "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
          outline: "text-foreground",
          success: "border-transparent bg-green-500 text-white hover:bg-green-500/80", // Custom
          warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80", // Custom
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  )
  */
