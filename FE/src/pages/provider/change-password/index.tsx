import React, { useState } from "react";
import { Button, Input, Form, notification, Typography } from "antd";
import ProviderLayout from "@/layouts/ProviderLayout";

const { Title } = Typography;

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
    <div className="flex flex-col">
      <div className="flex flex-col justify-center items-center h-full mt-0">
        <Title level={2} className="mb-8">
          Đổi mật khẩu
        </Title>

        <div className="w-full max-w-md">
          <Form
            layout="vertical"
            name="change-password"
            form={form}
            onFinish={handlePasswordChange}
            autoComplete="off"
            className="mt-5"
          >
            {/* Old Password */}
            <Form.Item
              name="oldPassword"
              label="Mật khẩu hiện tại"
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
                className="h-12 border-gray-400"
              />
            </Form.Item>

            {/* New Password */}
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
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
                className="h-12 border-gray-400"
              />
            </Form.Item>

            {/* Confirm Password */}
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
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
                className="h-12 border-gray-400"
              />
            </Form.Item>

            <Form.Item className="mt-8">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 text-lg font-bold"
              >
                {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

// Thiết lập Layout
ChangePasswordPage.Layout = ProviderLayout;
