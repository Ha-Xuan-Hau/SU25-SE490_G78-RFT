import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Card, Tag } from "antd";
import { UploadMultipleImage } from "./UploadMultipleImage";

interface EditSingleVehicleInGroupModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (data: {
    images: string[];
    licensePlate: string;
    status: string;
  }) => void;
  initialImages?: string[];
  initialLicensePlate?: string;
  initialStatus?: string;
  loading?: boolean;
}

const EditSingleVehicleInGroupModal: React.FC<
  EditSingleVehicleInGroupModalProps
> = ({
  open,
  onCancel,
  onOk,
  initialImages = [],
  initialLicensePlate = "",
  initialStatus = "AVAILABLE",
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [isActive, setIsActive] = useState(initialStatus !== "UNAVAILABLE");

  useEffect(() => {
    form.setFieldsValue({
      images: initialImages,
      licensePlate: initialLicensePlate,
    });
    setIsActive(initialStatus !== "UNAVAILABLE");
  }, [initialImages, initialLicensePlate, initialStatus, open]);

  return (
    <Modal
      open={open}
      title="Chỉnh sửa ảnh và biển số xe"
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onOk({
            images: values.images,
            licensePlate: values.licensePlate,
            status: isActive ? "AVAILABLE" : "UNAVAILABLE",
          });
        }}
      >
        <Card
          title={
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <span>Thông tin xe</span>
                <Tag
                  color={isActive ? "green" : "orange"}
                  className="rounded-full px-3 py-1"
                >
                  {isActive ? "Đang hoạt động" : "Không hoạt động"}
                </Tag>
              </div>
              <Button
                danger={!isActive}
                onClick={() => setIsActive((prev) => !prev)}
                type="default"
              >
                {isActive ? "Ẩn xe" : "Hiện xe"}
              </Button>
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
          >
            <UploadMultipleImage />
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
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditSingleVehicleInGroupModal;
