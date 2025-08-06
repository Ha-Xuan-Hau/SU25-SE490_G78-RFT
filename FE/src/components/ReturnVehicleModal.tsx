import React from "react";
import { Modal, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface ReturnVehicleModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  vehicleInfo?: {
    bookingId?: string;
    vehicleThumb?: string;
    licensePlate?: string;
    model?: string;
  };
}

export const ReturnVehicleModal: React.FC<ReturnVehicleModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  loading = false,
  vehicleInfo,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined className="text-orange-500" />
          <span>Xác nhận trả xe</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onConfirm}
          loading={loading}
          danger
        >
          Xác nhận trả xe
        </Button>,
      ]}
      centered
      width={480}
    >
      <div className="py-4">
        <p className="text-gray-700 mb-4">
          Bạn có chắc chắn muốn xác nhận đã trả xe không?
        </p>

        {!!vehicleInfo && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4 flex items-center gap-3">
            {/* Thumb is the vehicle name, not an image */}
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Mã booking:{" "}
                <span className="font-semibold">
                  {vehicleInfo.bookingId || "N/A"}
                </span>
              </div>
              <div className="font-medium">
                {vehicleInfo.vehicleThumb || "Không xác định"}
              </div>
              <div className="text-sm text-gray-500">
                Biển số: {vehicleInfo.licensePlate || "N/A"}
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">Lưu ý:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Khách hàng vui lòng kiểm tra lại hành lý của mình, đảm bảo không để
                  quên đồ dùng cá nhân trên xe
                </li>
                <li>Khách hàng vui lòng dọn dẹp xe trước khi trả lại</li>
                <li>Sau khi xác nhận, chủ xe sẽ được thông báo và sẽ xác nhận xe và hoàn thành đơn của bạn</li>
                <li>Vui lòng kiểm tra trạng thái đơn sau khi chủ xe xác nhận</li>
                <li>Quá trình thuê xe sẽ kết thúc</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReturnVehicleModal;
