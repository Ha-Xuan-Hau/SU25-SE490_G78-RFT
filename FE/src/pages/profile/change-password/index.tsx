"use client";

import { useState } from "react";
import { Button, Input, Form, notification, Typography, Card } from "antd"; // Import Card
import { ProfileLayout } from "@/layouts/ProfileLayout";

const { Title, Text } = Typography; // Thêm Text nếu cần

// Interface cho form values
interface PasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  // Mock function for password change
  const handlePasswordChange = (values: PasswordFormValues) => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      console.log("Password change values:", values);
      // Show success notification
      notification.success({
        message: "Thay đổi mật khẩu thành công",
        description: "Mật khẩu của bạn đã được cập nhật.",
      });
      // Reset form
      form.resetFields();
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex justify-center">
      <Card className="shadow-lg rounded-lg p-8 w-full max-w-md ">
        <div className="text-center mb-8">
          <Title level={2} className="m-0 text-gray-900">
            Đổi mật khẩu
          </Title>
          <Text className="text-gray-600 mt-2 block">
            Cập nhật mật khẩu của bạn để bảo mật tài khoản.
          </Text>{" "}
          {/* Thêm mô tả */}
        </div>
        <Form
          layout="vertical"
          name="change-password"
          form={form}
          onFinish={handlePasswordChange}
          autoComplete="off"
          className="space-y-4" // Thêm khoảng cách giữa các Form.Item
        >
          {/* Old Password */}
          <Form.Item
            name="oldPassword"
            label={
              <span className="text-base font-medium text-gray-700">
                Mật khẩu hiện tại
              </span>
            } // Điều chỉnh label
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu hiện tại!",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="Nhập mật khẩu hiện tại"
              size="large"
              className="h-12 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500" // Điều chỉnh style
            />
          </Form.Item>

          {/* New Password */}
          <Form.Item
            name="newPassword"
            label={
              <span className="text-base font-medium text-gray-700">
                Mật khẩu mới
              </span>
            } // Điều chỉnh label
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu mới!",
              },
              {
                min: 6,
                message: "Mật khẩu phải có ít nhất 6 ký tự!",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới"
              size="large"
              className="h-12 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500" // Điều chỉnh style
            />
          </Form.Item>

          {/* Confirm Password */}
          <Form.Item
            name="confirmPassword"
            label={
              <span className="text-base font-medium text-gray-700">
                Xác nhận mật khẩu mới
              </span>
            } // Điều chỉnh label
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Vui lòng xác nhận mật khẩu mới!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không trùng khớp!")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Xác nhận mật khẩu mới"
              size="large"
              className="h-12 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500" // Điều chỉnh style
            />
          </Form.Item>

          <Form.Item className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-lg font-bold bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600" // Điều chỉnh style
            >
              {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

// Thiết lập Layout
ChangePasswordPage.Layout = ProfileLayout;
