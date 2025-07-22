import React from "react";
import { Modal, Card, Tag } from "antd";
import { formatCurrency } from "@/lib/format-currency";
import { translateENtoVI } from "@/lib/viDictionary";
import { BookingDetail } from "@/types/booking";

type Vehicle = BookingDetail["vehicles"][0];

interface VehicleSelectionModalProps {
  open: boolean;
  onCancel: () => void;
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  currentRatingMap: Record<string, any>;
  bookingId: string; // Added this prop
}

const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  open,
  onCancel,
  vehicles,
  onSelectVehicle,
  currentRatingMap,
  bookingId, // Added this prop
}) => {
  return (
    <Modal
      title={
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Chọn xe để đánh giá</h3>
          <p className="text-sm text-gray-600">
            Vui lòng chọn xe bạn muốn đánh giá từ danh sách dưới đây
          </p>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
    >
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {vehicles.map((vehicle, index) => {
          // FIXED: Use proper rating key with bookingId
          const ratingKey = `${bookingId}_${vehicle.id}`;
          const vehicleRating = currentRatingMap[ratingKey];

          return (
            <Card
              key={vehicle.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 hover:border-blue-300"
              onClick={() => onSelectVehicle(vehicle)}
              bodyStyle={{ padding: "16px" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">
                      {vehicle.thumb}
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag color="blue" className="text-xs">
                          {translateENtoVI(vehicle.vehicleTypes)}
                        </Tag>
                        <span className="text-sm text-gray-600">
                          Biển số:{" "}
                          <span className="font-mono font-medium">
                            {vehicle.licensePlate}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Chủ xe: {vehicle.user.fullName}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(vehicle.costPerDay)}/ngày
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Tag
                    color={vehicle.status === "AVAILABLE" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.status === "AVAILABLE"
                      ? "Hoạt động"
                      : "Không hoạt động"}
                  </Tag>
                  {vehicleRating ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600">
                        Đã đánh giá ({vehicleRating.star} sao)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Chưa đánh giá
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Modal>
  );
};

export default VehicleSelectionModal;
