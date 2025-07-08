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

// Assuming RatingModal exists and is imported correctly
import RatingModal from "./RatingModal";

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

  if (status === "Đã tất toán") {
    variant = "success"; // Custom variant for success/completed
    text = "Đã hoàn thành";
  } else if (status === "Đang thực hiện") {
    variant = "default"; // Blue for active/renting
    text = "Đang thuê";
  } else if (status === "Đã hủy" || status === "Đã hủy") {
    // Check both info.status and info.contract.status
    variant = "destructive"; // Red for cancelled
    text = "Đã hủy";
  } else {
    variant = "warning"; // Yellow for pending/waiting
    text = "Đang chờ";
  }

  return (
    <Badge
      variant={variant}
      className="rounded-full text-xs px-3 py-1 font-medium"
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

  const showModal = (bookingId: string, carId: string) => {
    setBookingId(bookingId);
    setCarId(carId);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Calculate rental duration
  const startDate = moment(info?.timeBookingStart);
  const endDate = moment(info?.timeBookingEnd);
  const durationDays = endDate.diff(startDate, "days");
  const durationText =
    durationDays > 0 ? `${durationDays} ngày` : "Dưới 1 ngày";

  return (
    <Card className="w-full  shadow-md hover:shadow-lg transition-shadow duration-200">
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
            <Link href={`/profile/booking-detail/${info?._id}`} passHref>
              <Button variant="outline">Chi tiết</Button>
            </Link>
            {info?.contract?.status === "Đã tất toán" && (
              <Button
                variant="default" // Changed to default for "Đánh giá"
                onClick={() => showModal(info._id, info.carId._id)}
              >
                Đánh giá
              </Button>
            )}
            <RatingModal
              open={open}
              handleCancel={handleCancel}
              bookingId={bookingId}
              carId={carId}
              accessToken={accessToken}
            />
          </div>
        </div>
      </CardContent>
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
