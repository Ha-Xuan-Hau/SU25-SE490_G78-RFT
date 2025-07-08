import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  notification,
  Modal,
  Avatar,
  Upload,
  message,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  UploadOutlined,
  LoadingOutlined,
  PlusOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type { RcFile, UploadProps, UploadFile } from "antd/es/upload/interface";
import { User } from "@/types/user";

// Định nghĩa interface cho props
interface EditProfileModalProps {
  openEditModal: boolean;
  handleCancleEditModal: () => void;
  currentUser?: User;
  onUserUpdate?: (user: Partial<User>) => void;
}

// Interface cho form values
interface FormValues {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: moment.Moment;
  profilePicture?: string;
}

const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const beforeUpload = (file: RcFile) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("Bạn chỉ có thể tải lên file JPG/PNG!");
  }

  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Ảnh phải nhỏ hơn 1MB!");
  }

  return isJpgOrPng && isLt1M;
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  openEditModal,
  handleCancleEditModal,
  currentUser,
  onUserUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  useEffect(() => {
    if (openEditModal && currentUser) {
      form.setFieldsValue({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone,
        address: currentUser.address,
        dateOfBirth: currentUser.dateOfBirth
          ? moment()
              .set("year", currentUser.dateOfBirth[0])
              .set("month", currentUser.dateOfBirth[1] - 1)
              .set("date", currentUser.dateOfBirth[2])
          : undefined,
      });

      setImageUrl(currentUser.profilePicture);
    }
  }, [openEditModal, currentUser, form]);

  // Hàm xử lý cập nhật thông tin người dùng
  const handleUpdateProfile = (values: FormValues) => {
    setLoading(true);

    // Chuyển đổi ngày sinh từ moment sang mảng [năm, tháng, ngày]
    const dateOfBirth = values.dateOfBirth
      ? [
          values.dateOfBirth.year(),
          values.dateOfBirth.month() + 1,
          values.dateOfBirth.date(),
        ]
      : undefined;

    // Giả lập API call với setTimeout
    setTimeout(() => {
      // Cập nhật dữ liệu người dùng trong state
      const updatedUserData: Partial<User> = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        dateOfBirth,
        profilePicture: imageUrl,
      };

      if (onUserUpdate) {
        onUserUpdate(updatedUserData);
      }

      // Hiển thị thông báo thành công
      notification.success({
        message: "Cập nhật thành công",
        description: "Thông tin của bạn đã được cập nhật",
      });

      // Đóng modal
      handleCancleEditModal();
      setLoading(false);
    }, 1000);
  };

  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setImageLoading(true);
      return;
    }

    if (info.file.status === "done") {
      // Get this url from response in real world
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setImageLoading(false);
        setImageUrl(url);
      });
    } else if (info.file.status === "error") {
      setImageLoading(false);
      message.error("Tải ảnh thất bại");
    }
  };

  return (
    <Modal
      title="Cập Nhật Thông Tin"
      open={openEditModal}
      onCancel={handleCancleEditModal}
      footer={null}
      width={600}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        name="editProfileForm"
        onFinish={handleUpdateProfile}
        className="mt-5"
      >
        {/* Phần upload ảnh ở giữa */}
        <div className="flex justify-center mb-6">
          <Upload
            name="avatar"
            listType="picture"
            showUploadList={false}
            action=""
            beforeUpload={beforeUpload}
            onChange={handleChange}
            className="cursor-pointer"
          >
            <div className="text-center">
              <div className="mb-3 relative inline-block">
                {imageLoading ? (
                  <div className="w-[120px] h-[120px] rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100">
                    <LoadingOutlined style={{ fontSize: 30 }} />
                  </div>
                ) : imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Avatar"
                      className="w-[120px] h-[120px] rounded-full object-cover border-2 border-gray-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <CameraOutlined
                        style={{ fontSize: 30, color: "white" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-[120px] h-[120px] rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center bg-gray-50">
                      <UserOutlined
                        style={{ fontSize: 60, color: "#bfbfbf" }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <CameraOutlined
                        style={{ fontSize: 30, color: "white" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="text-blue-500 hover:text-blue-700">
                Thay đổi ảnh
              </div>
            </div>
          </Upload>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Họ và tên" name="fullName">
              <Input placeholder="Nhập họ tên của bạn" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  type: "email",
                  message: "Email không hợp lệ!",
                },
              ]}
            >
              <Input placeholder="Nhập email của bạn" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Số điện thoại phải có 10 chữ số!",
                },
              ]}
            >
              <Input placeholder="Nhập số điện thoại của bạn" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Ngày sinh" name="dateOfBirth">
              <DatePicker
                placeholder="Chọn ngày sinh"
                format="DD/MM/YYYY"
                className="w-full"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea placeholder="Nhập địa chỉ của bạn" rows={3} />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={handleCancleEditModal}>Hủy</Button>
          <Button
            type="primary"
            loading={loading}
            htmlType="submit"
            className="bg-blue-500 hover:bg-blue-600"
          >
            Cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
