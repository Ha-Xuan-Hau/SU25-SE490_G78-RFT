import React, { useState } from "react";
import { Button, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency";
import moment from "moment";
import RatingModal from "./RatingModal";
import { Vehicle } from "@/types/vehicle";

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
  };
  timeBookingStart: string;
  timeBookingEnd: string;
  totalCost: number;
  status?: string;
  contract?: {
    status: string;
  };
}

interface VehicleRentalCardProps {
  info: BookingInfo;
  accessToken?: string;
}

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

  return (
    <div className="flex flex-col border rounded-xl border-solid border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Ảnh xe - Đã tăng kích thước và sử dụng aspect ratio */}
        <div className="w-full md:w-1/3 h-auto">
          <div className="relative aspect-video w-full h-full rounded-lg overflow-hidden">
            <Image
              src={info?.carId?.thumb || "/images/car-placeholder.jpg"}
              alt="car"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover rounded-lg"
              style={{ objectPosition: "center" }}
            />
          </div>
        </div>

        {/* Thông tin xe */}
        <div className="flex flex-col w-full md:w-2/3 justify-between">
          <div className="flex justify-between items-center">
            <h5 className="text-xl md:text-2xl line-clamp-1 font-bold mt-0 m-0">
              {info?.carId?.model?.name || "Unknown Model"}{" "}
              {info?.carId?.yearManufacture || "N/A"}
            </h5>
            <div>
              {info?.contract?.status === "Đã tất toán" ? (
                <Tag className="rounded-full text-base" color="green">
                  Đã hoàn thành
                </Tag>
              ) : info?.contract?.status === "Đang thực hiện" ? (
                <Tag className="rounded-full text-base" color="green">
                  Đang thuê
                </Tag>
              ) : info?.contract?.status === "Đã hủy" ||
                info?.status === "Đã hủy" ? (
                <Tag className="rounded-full text-base" color="red">
                  Đã hủy
                </Tag>
              ) : (
                <Tag className="rounded-full text-base" color="yellow">
                  Đang chờ
                </Tag>
              )}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl line-clamp-1 text-red-500 font-bold my-2">
            {formatCurrency(info?.totalCost)}
          </h2>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <p className="line-clamp-1 font-normal m-0">
                <span className="font-medium">Ngày thuê:</span>{" "}
                {moment(info?.timeBookingStart).format("DD-MM-YYYY")}
              </p>
              <p className="line-clamp-1 font-normal m-0">
                <span className="font-medium">Ngày trả:</span>{" "}
                {moment(info?.timeBookingEnd).format("DD-MM-YYYY")}
              </p>
            </div>

            <div className="flex gap-4 mt-2 md:mt-0 self-end">
              <Link href={`/profile/booking-detail/${info?._id}`}>
                <Button size="middle" type="primary">
                  Chi tiết
                </Button>
              </Link>
              {info?.contract?.status === "Đã tất toán" && (
                <Button
                  size="middle"
                  className="bg-red-600 text-gray-50"
                  danger
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
        </div>
      </div>
    </div>
  );
};

export default VehicleRentalCard;
