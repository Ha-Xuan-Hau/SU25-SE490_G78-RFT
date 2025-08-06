"use client";

import { useState } from "react";
import { Button, Modal, Form, Input, notification } from "antd";
import { FlagOutlined, CloseOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { createReport } from "@/apis/report.api";
import { useAuth } from "@/context/AuthContext"; // hoặc context auth của bạn

const { TextArea } = Input;

interface ReportButtonProps {
  targetId: string;
  reportType: "SPAM" | "INAPPROPRIATE";
  buttonText?: string;
  size?: "small" | "middle" | "large";
  type?: "default" | "primary" | "text" | "link";
  icon?: boolean;
}

export default function ReportButton({
  targetId,
  reportType,
  buttonText,
  size = "small",
  type = "text",
  icon = true,
}: ReportButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  // Hook để kiểm tra authentication - thay đổi theo auth system của bạn
  const { user, isAuthenticated } = useAuth(); // hoặc useUser(), useSession(), etc.

  // Mapping reportType to generalType and display text
  const getReportConfig = (reportType: string) => {
    switch (reportType) {
      case "SPAM":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "SPAM",
          displayText: "Spam",
          placeholder: "Vui lòng mô tả chi tiết về hành vi spam...",
        };
      case "INAPPROPRIATE":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "INAPPROPRIATE",
          displayText: "Sai thông tin xe",
          placeholder: "Vui lòng mô tả chi tiết về thông tin sai lệch...",
        };
      default:
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "OTHER",
          displayText: "Khác",
          placeholder: "Vui lòng mô tả chi tiết...",
        };
    }
  };

  // Handle click report button
  const handleReportClick = () => {
    // Kiểm tra đăng nhập trước
    if (!isAuthenticated || !user) {
      notification.warning({
        message: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để có thể báo cáo vi phạm.",
        duration: 4,
      });

      // Bỏ dòng này: router.push('/login');
      return;
    }

    // Nếu đã đăng nhập, mở modal
    setIsModalVisible(true);
  };

  const handleReport = async (values: { reason: string }) => {
    try {
      setLoading(true);

      const config = getReportConfig(reportType);

      const reportData = {
        targetId,
        generalType: config.generalType,
        type: config.type,
        reason: values.reason,
      };

      await createReport(reportData);

      notification.success({
        message: "Báo cáo thành công",
        description:
          "Chúng tôi sẽ xem xét báo cáo của bạn trong thời gian sớm nhất.",
        duration: 4,
      });

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error creating report:", error);

      // Handle specific error messages
      let errorMessage = "Không thể gửi báo cáo. Vui lòng thử lại sau.";

      // Type guard for error object
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null &&
        "status" in (error as any).response
      ) {
        const status = (error as any).response.status;
        if (status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        } else if (status === 429) {
          errorMessage = "Bạn đã báo cáo quá nhiều. Vui lòng thử lại sau.";
        } else if (status === 400) {
          errorMessage = "Dữ liệu báo cáo không hợp lệ.";
        }
      }

      notification.error({
        message: "Lỗi",
        description: errorMessage,
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const config = getReportConfig(reportType);

  return (
    <>
      <Button
        type={type}
        size={size}
        icon={icon ? <FlagOutlined /> : undefined}
        onClick={handleReportClick} // Sử dụng handleReportClick thay vì trực tiếp mở modal
        className="text-red-500 hover:text-red-600 hover:bg-red-50 border-none shadow-none"
      >
        {buttonText || "Báo cáo"}
      </Button>

      <Modal
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
        className="report-modal"
        closeIcon={
          <CloseOutlined className="text-gray-500 hover:text-gray-700" />
        }
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Báo xấu</h2>
        </div>

        <Form form={form} layout="vertical" onFinish={handleReport}>
          {/* Label */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vui lòng chọn lí do
            </label>

            {/* Fixed reason display */}
            <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed">
              {config.displayText}
            </div>
          </div>

          {/* Reason textarea */}
          <Form.Item
            name="reason"
            rules={[
              { required: true, message: "Vui lòng nhập lý do" },
              { min: 10, message: "Lý do phải có ít nhất 10 ký tự" },
              { max: 500, message: "Lý do không được vượt quá 500 ký tự" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={config.placeholder}
              className="resize-none"
              maxLength={500}
            />
          </Form.Item>

          {/* Submit button */}
          <Form.Item className="mb-0 mt-6">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 rounded-md font-medium"
            >
              Báo cáo
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
