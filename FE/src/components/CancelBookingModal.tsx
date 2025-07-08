"use client";

import React, { useState } from "react";
import { Modal, Radio, Input, Button, Space, RadioChangeEvent } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;

interface CancelBookingModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingId: string;
  userType: "customer" | "provider"; // Phân biệt khách hàng và nhà cung cấp
  loading?: boolean;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  bookingId,
  userType,
  loading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  // Lý do hủy cho khách hàng
  const customerReasons = [
    "Tôi muốn thêm/đổi mã giảm giá",
    "Tôi muốn đổi xe",
    "Thủ tục rắc rối",
    "Tôi tìm thấy chỗ khác có giá tốt hơn",
    "Tôi không còn nhu cầu",
    "Tôi không thấy có lý do phù hợp",
  ];

  // Lý do hủy cho nhà cung cấp
  const providerReasons = [
    "Người thuê yêu cầu hủy",
    "Xe có vấn đề",
    "Khách hàng không đáp ứng điều kiện",
    "Thời gian thuê không phù hợp",
    "Lý do khác",
  ];

  const reasons = userType === "customer" ? customerReasons : providerReasons;

  const handleReasonChange = (e: RadioChangeEvent) => {
    setSelectedReason(e.target.value);
    if (
      e.target.value !== "Tôi không thấy có lý do phù hợp" &&
      e.target.value !== "Lý do khác"
    ) {
      setCustomReason("");
    }
  };

  const handleConfirm = async () => {
    let finalReason = selectedReason;

    // Nếu chọn "Tôi không thấy có lý do phù hợp" hoặc "Lý do khác", sử dụng custom reason
    if (
      (selectedReason === "Tôi không thấy có lý do phù hợp" ||
        selectedReason === "Lý do khác") &&
      customReason.trim()
    ) {
      finalReason = customReason.trim();
    }

    if (!finalReason) {
      return;
    }

    await onConfirm(finalReason);
    handleReset();
  };

  const handleReset = () => {
    setSelectedReason("");
    setCustomReason("");
  };

  const handleModalCancel = () => {
    handleReset();
    onCancel();
  };

  const isCustomReasonRequired =
    selectedReason === "Tôi không thấy có lý do phù hợp" ||
    selectedReason === "Lý do khác";

  const isConfirmDisabled =
    !selectedReason ||
    (isCustomReasonRequired && !customReason.trim()) ||
    loading;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined className="text-red-500" />
          <span>Xác nhận hủy đặt xe</span>
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      width={500}
      footer={
        <Space>
          <Button onClick={handleModalCancel} disabled={loading}>
            Quay lại
          </Button>
          <Button
            type="primary"
            danger
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            loading={loading}
          >
            Xác nhận hủy
          </Button>
        </Space>
      }
    >
      <div className="py-4">
        <p className="mb-4 text-gray-600">Vui lòng chọn lý do hủy đặt xe:</p>

        <Radio.Group
          value={selectedReason}
          onChange={handleReasonChange}
          className="w-full"
        >
          <div className="space-y-3">
            {reasons.map((reason) => (
              <Radio
                key={reason}
                value={reason}
                className="block w-full p-2 hover:bg-gray-50 rounded"
              >
                {reason}
              </Radio>
            ))}
          </div>
        </Radio.Group>

        {isCustomReasonRequired && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vui lòng mô tả chi tiết:
            </label>
            <TextArea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
              rows={3}
              maxLength={200}
              showCount
            />
          </div>
        )}

        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-600">
            <strong>Lưu ý:</strong> Sau khi hủy, đơn đặt xe sẽ không thể khôi
            phục.
            {userType === "customer" &&
              " Phí hủy có thể được áp dụng tùy theo thời gian hủy."}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CancelBookingModal;
