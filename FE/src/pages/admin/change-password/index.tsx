"use client";

import { useState } from "react";
import { Button, Input, Form, Typography, Card } from "antd";
import { changePassword } from "@/apis/auth.api";
import { showApiSuccess, showApiError } from "@/utils/toast.utils";
import AdminLayout from "@/layouts/AdminLayout";

const { Title, Text } = Typography;

// Interface cho form values - cập nhật theo backend
interface PasswordFormValues {
  password: string; // đổi từ oldPassword thành password
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  // Xử lý thay đổi mật khẩu với API thực
  const handlePasswordChange = async (values: PasswordFormValues) => {
    setLoading(true);

    try {
      // Gọi API change password
      await changePassword({
        password: values.password,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      // Hiển thị thông báo thành công
      showApiSuccess("Mật khẩu đã được đổi thành công!");

      // Reset form
      form.resetFields();
    } catch (error: any) {
      // Hiển thị lỗi từ backend
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Card className="shadow-lg rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2} className="m-0 text-gray-900">
            Đổi mật khẩu
          </Title>
          <Text className="text-gray-600 mt-2 block">
            Cập nhật mật khẩu của bạn để bảo mật tài khoản.
          </Text>
        </div>

        <Form
          layout="vertical"
          name="change-password"
          form={form}
          onFinish={handlePasswordChange}
          autoComplete="off"
          className="space-y-4"
        >
          {/* Current Password */}
          <Form.Item
            name="password" // đổi từ oldPassword thành password
            label={
              <span className="text-base font-medium text-gray-700">
                Mật khẩu hiện tại
              </span>
            }
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu hiện tại!",
              },
              {
                min: 6,
                message: "Mật khẩu phải có ít nhất 6 ký tự!",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="Nhập mật khẩu hiện tại"
              size="large"
              className="h-12 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            />
          </Form.Item>

          {/* New Password */}
          <Form.Item
            name="newPassword"
            label={
              <span className="text-base font-medium text-gray-700">
                Mật khẩu mới
              </span>
            }
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu mới!",
              },
              {
                min: 7,
                message: "Mật khẩu phải có ít nhất 7 ký tự!",
              },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/,
                message:
                  "Mật khẩu phải có ít nhất một chữ hoa, một chữ thường và một số!",
              },
              // Kiểm tra không trùng với mật khẩu cũ
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      "Mật khẩu mới không được trùng với mật khẩu hiện tại!"
                    )
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới"
              size="large"
              className="h-12 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            />
          </Form.Item>

          {/* Confirm Password */}
          <Form.Item
            name="confirmPassword"
            label={
              <span className="text-base font-medium text-gray-700">
                Xác nhận mật khẩu mới
              </span>
            }
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
              className="h-12 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            />
          </Form.Item>

          {/* Note về yêu cầu mật khẩu */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <Text className="text-sm text-blue-700">
              <strong>Lưu ý:</strong> Mật khẩu mới phải có ít nhất 7 ký tự, bao
              gồm chữ hoa, chữ thường và số.
            </Text>
          </div>

          <Form.Item className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={loading}
              className="w-full h-12 text-lg font-bold bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
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
ChangePasswordPage.Layout = AdminLayout;
