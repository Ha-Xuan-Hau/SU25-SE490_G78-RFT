import React, { useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Input, Form, notification, Modal } from "antd";

// Định nghĩa interface cho props
interface EditProfileModalProps {
  openEditModal: boolean;
  handleCancleEditModal: () => void;
}

// Interface cho dữ liệu user
interface User {
  id?: string;
  result?: {
    fullname?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
  };
}

// Interface cho form values
interface FormValues {
  fullname?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  openEditModal,
  handleCancleEditModal,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  // Mock user data
  const [user, setUser] = useState<User>({
    id: "mock-id-123",
    result: {
      fullname: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      phoneNumber: "0987654321",
      address: "123 Đường ABC, Quận XYZ, TP. HCM",
    },
  });

  // Mock access token
  const [accessToken] = useLocalStorage("access_token", null);

  // Hàm xử lý cập nhật thông tin người dùng (mock)
  const handleUpdateProfile = (values: FormValues) => {
    setLoading(true);

    // Giả lập API call với setTimeout
    setTimeout(() => {
      // Cập nhật dữ liệu người dùng trong state
      setUser((prevUser) => ({
        ...prevUser,
        result: {
          ...prevUser.result,
          fullname: values.fullname || prevUser.result?.fullname,
          email: values.email || prevUser.result?.email,
          phoneNumber: values.phoneNumber || prevUser.result?.phoneNumber,
          address: values.address || prevUser.result?.address,
        },
      }));

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

  return (
    <Modal
      open={openEditModal}
      onCancel={handleCancleEditModal}
      footer={[
        <Button
          key="submit"
          loading={loading}
          htmlType="submit"
          type="primary"
          className="w-full h-12 text-lg font-bold"
          onClick={() => {
            form.submit();
          }}
        >
          Cập nhật
        </Button>,
      ]}
    >
      <p className="flex justify-center items-center w-full text-2xl font-bold">
        Cập nhật thông tin
      </p>
      <Form
        form={form}
        layout="vertical"
        name="basic"
        onFinish={handleUpdateProfile}
        autoComplete="off"
        className="mt-5"
        initialValues={{
          fullname: user.result?.fullname,
          email: user.result?.email,
          phoneNumber: user.result?.phoneNumber,
          address: user.result?.address,
        }}
      >
        <Form.Item
          label="Họ và tên"
          name="fullname"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập họ và tên!",
            },
          ]}
        >
          <Input
            className="h-12 border-gray-400"
            placeholder="Nhập họ tên của bạn"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập địa chỉ!",
            },
          ]}
        >
          <Input
            className="h-12 border-gray-400"
            placeholder="Nhập địa chỉ của bạn"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              type: "email",
              message: "Email không hợp lệ!",
            },
            {
              required: true,
              message: "Vui lòng nhập email!",
            },
          ]}
        >
          <Input
            className="h-12 border-gray-400"
            placeholder="Nhập email của bạn"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phoneNumber"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập số điện thoại!",
            },
            {
              pattern: /^[0-9]{10}$/,
              message: "Số điện thoại phải có 10 chữ số!",
            },
          ]}
        >
          <Input
            className="h-12 border-gray-400"
            placeholder="Nhập số điện thoại của bạn"
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
