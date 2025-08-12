import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Card, Tag } from "antd";
import {
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { UploadMultipleImage } from "../uploadImage/UploadMultipleImage";
import { UploadSingleImage } from "../uploadImage/UploadSingleImage";
import { toggleVehicleStatus } from "@/apis/vehicle.api";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";

interface EditSingleVehicleInGroupModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (data: {
    images: string[];
    documents: string;
    licensePlate: string;
  }) => void;
  initialImages?: string[];
  initialDocuments?: string;
  initialLicensePlate?: string;
  loading?: boolean;
  vehicleId?: string; // Thêm vehicleId
  vehicleStatus?: string; // Thêm status hiện tại
  vehicleName?: string; // Thêm tên xe để hiển thị
  onStatusChanged?: () => void; // Callback khi status thay đổi
}

const EditSingleVehicleInGroupModal: React.FC<
  EditSingleVehicleInGroupModalProps
> = ({
  open,
  onCancel,
  onOk,
  initialImages = [],
  initialDocuments = "",
  initialLicensePlate = "",
  loading = false,
  vehicleId,
  vehicleStatus,
  vehicleName,
  onStatusChanged,
}) => {
  const [form] = Form.useForm();
  const [toggleLoading, setToggleLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(vehicleStatus);

  useEffect(() => {
    form.setFieldsValue({
      images: initialImages,
      documents: initialDocuments,
      licensePlate: initialLicensePlate,
    });
    setCurrentStatus(vehicleStatus);
  }, [
    initialImages,
    initialDocuments,
    initialLicensePlate,
    vehicleStatus,
    open,
    form,
  ]);

  const handleToggleStatus = async () => {
    if (!vehicleId) return;

    const isSuspended = currentStatus === "SUSPENDED";
    const actionText = isSuspended ? "đưa vào hoạt động" : "dừng hoạt động";

    Modal.confirm({
      title: `Xác nhận ${actionText}`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Bạn có chắc chắn muốn {actionText} xe &quot;{vehicleName || "này"}
            &quot;?
          </p>
          {currentStatus === "AVAILABLE" && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Xe đang có booking sẽ không thể dừng
                hoạt động
              </p>
            </div>
          )}
        </div>
      ),
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        setToggleLoading(true);
        try {
          const result = await toggleVehicleStatus(vehicleId);

          // Kiểm tra response từ backend
          if (result.success === false) {
            showApiError(result, `Không thể ${actionText}`);
            return;
          }

          const newStatus = isSuspended ? "AVAILABLE" : "SUSPENDED";
          setCurrentStatus(newStatus);
          showApiSuccess(result.message || `Đã ${actionText} thành công`);

          if (onStatusChanged) {
            onStatusChanged();
          }
        } catch (error) {
          console.error("Toggle error:", error);
          showApiError(error, `Không thể ${actionText}`);
        } finally {
          setToggleLoading(false);
        }
      },
    });
  };

  const getStatusTag = () => {
    if (!currentStatus) return null;

    const statusConfig = {
      AVAILABLE: { color: "green", text: "Đang hoạt động" },
      SUSPENDED: { color: "volcano", text: "Tạm dừng" },
      PENDING: { color: "orange", text: "Chờ duyệt" },
      UNAVAILABLE: { color: "red", text: "Không khả dụng" },
    } as const;

    const config = statusConfig[currentStatus as keyof typeof statusConfig] || {
      color: "default",
      text: currentStatus,
    };

    return (
      <Tag color={config.color} className="rounded-full px-3 py-1">
        {config.text}
      </Tag>
    );
  };

  const canToggleStatus =
    currentStatus === "AVAILABLE" || currentStatus === "SUSPENDED";

  return (
    <Modal
      open={open}
      title="Chỉnh sửa thông tin xe"
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onOk({
            images: values.images,
            documents: values.documents,
            licensePlate: values.licensePlate,
          });
        }}
      >
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>Thông tin xe</span>
                {getStatusTag()}
              </div>
              {canToggleStatus && vehicleId && (
                <Button
                  size="small"
                  danger={currentStatus === "AVAILABLE"}
                  type={currentStatus === "SUSPENDED" ? "primary" : "default"}
                  loading={toggleLoading}
                  onClick={handleToggleStatus}
                  icon={
                    currentStatus === "SUSPENDED" ? (
                      <EyeOutlined />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                >
                  {currentStatus === "SUSPENDED"
                    ? "Đưa vào hoạt động"
                    : "Dừng hoạt động"}
                </Button>
              )}
            </div>
          }
          className="mb-4"
        >
          <Form.Item
            label="Các hình ảnh xe"
            name="images"
            rules={[
              {
                required: true,
                message: "Vui lòng tải lên ít nhất một hình ảnh",
              },
            ]}
            tooltip="Tải lên tối đa 4 ảnh xe"
          >
            <UploadMultipleImage />
          </Form.Item>

          <Form.Item
            label="Giấy tờ sở hữu xe"
            name="documents"
            rules={[
              {
                required: true,
                message: "Vui lòng tải giấy tờ sở hữu xe",
              },
            ]}
            tooltip="Tải lên hình ảnh giấy tờ sở hữu xe (giấy đăng ký, hoá đơn mua xe,...)"
          >
            <UploadSingleImage />
          </Form.Item>

          <Form.Item
            label="Biển số xe"
            name="licensePlate"
            rules={[{ required: true, message: "Vui lòng nhập biển số xe" }]}
          >
            <Input placeholder="Ví dụ: 59P1-12345" />
          </Form.Item>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditSingleVehicleInGroupModal;
