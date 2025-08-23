"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Form, Input, Select } from "antd";
import {
  FlagOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { createReport } from "@/apis/report.api";
import { useAuth } from "@/context/AuthContext";
import {
  showApiError,
  showError,
  showSuccess,
  showWarning,
} from "@/utils/toast.utils";

const { TextArea } = Input;
const { Option } = Select;

interface ReportButtonProps {
  targetId: string;
  reportType?: string;
  reportTypes?: string[];
  booking?: string;
  evidenceUrl?: string; // Thêm trường này vào props
  showTypeSelector?: boolean;
  buttonText?: string;
  size?: "small" | "middle" | "large";
  type?: "default" | "primary" | "text" | "link";
  icon?: boolean;
  autoOpen?: boolean;
  onModalClose?: () => void;
}

export default function ReportButton({
  targetId,
  reportType,
  reportTypes,
  booking,
  evidenceUrl, // Nhận từ props
  showTypeSelector = false,
  buttonText,
  size = "small",
  type = "text",
  icon = true,
  autoOpen = false,
  onModalClose,
}: ReportButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (autoOpen) {
      setIsModalVisible(true);
      // Set giá trị mặc định cho evidenceUrl nếu được truyền từ props
      if (evidenceUrl) {
        form.setFieldsValue({ evidenceUrl: evidenceUrl });
      }
    }
  }, [autoOpen, evidenceUrl, form]);

  // Cập nhật handleCancel
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    onModalClose?.(); // Gọi callback
  };

  // Mapping reportType to generalType and display text
  const getReportConfig = (reportType: string) => {
    switch (reportType) {
      // SERIOUS ERRORS
      case "DAMAGED_VEHICLE":
        return {
          generalType: "SERIOUS_ERROR",
          type: "DAMAGED_VEHICLE",
          displayText: "Khách làm hư hỏng xe",
          placeholder:
            "Vui lòng mô tả chi tiết về thiệt hại mà khách hàng gây ra cho xe...",
        };
      case "FRAUD":
        return {
          generalType: "SERIOUS_ERROR",
          type: "FRAUD",
          displayText: "Lừa đảo",
          placeholder: "Vui lòng mô tả chi tiết về hành vi lừa đảo...",
        };
      case "MISLEADING_INFO":
        return {
          generalType: "SERIOUS_ERROR",
          type: "MISLEADING_INFO",
          displayText: "Xe khác với mô tả",
          placeholder:
            "Vui lòng mô tả chi tiết về sự khác biệt giữa xe thực tế và mô tả (biển số, mẫu xe, màu sắc...)...",
        };
      case "OWNER_NO_SHOW":
        return {
          generalType: "SERIOUS_ERROR",
          type: "OWNER_NO_SHOW",
          displayText: "Chủ xe không giao xe",
          placeholder:
            "Vui lòng mô tả chi tiết về việc chủ xe không giao xe như đã cam kết...",
        };
      case "OWNER_CANCEL_UNREASONABLY":
        return {
          generalType: "SERIOUS_ERROR",
          type: "OWNER_CANCEL_UNREASONABLY",
          displayText: "Chủ xe hủy đơn không lý do",
          placeholder:
            "Vui lòng mô tả chi tiết về việc chủ xe hủy đơn mà không có lý do rõ ràng...",
        };
      case "DOCUMENT_ISSUE":
        return {
          generalType: "SERIOUS_ERROR",
          type: "DOCUMENT_ISSUE",
          displayText: "Giấy tờ sai/mất",
          placeholder:
            "Vui lòng mô tả chi tiết về vấn đề với giấy tờ xe (thiếu, sai lệch, không hợp lệ...)...",
        };
      case "TECHNICAL_ISSUE":
        return {
          generalType: "SERIOUS_ERROR",
          type: "TECHNICAL_ISSUE",
          displayText: "Xe bị lỗi kỹ thuật",
          placeholder:
            "Vui lòng mô tả chi tiết về lỗi kỹ thuật của xe (chết máy, hỏng động cơ...)...",
        };
      case "UNSAFE_VEHICLE":
        return {
          generalType: "SERIOUS_ERROR",
          type: "UNSAFE_VEHICLE",
          displayText: "Xe không an toàn",
          placeholder:
            "Vui lòng mô tả chi tiết về vấn đề an toàn của xe (phanh hỏng, đèn không hoạt động...)...",
        };
      case "FUEL_LEVEL_INCORRECT":
        return {
          generalType: "SERIOUS_ERROR",
          type: "FUEL_LEVEL_INCORRECT",
          displayText: "Mức nhiên liệu không đúng",
          placeholder:
            "Vui lòng mô tả chi tiết về mức nhiên liệu không đúng như cam kết...",
        };
      case "NO_INSURANCE":
        return {
          generalType: "SERIOUS_ERROR",
          type: "NO_INSURANCE",
          displayText: "Không có bảo hiểm",
          placeholder:
            "Vui lòng mô tả chi tiết về việc xe không có bảo hiểm bắt buộc...",
        };
      case "EXPIRED_INSURANCE":
        return {
          generalType: "SERIOUS_ERROR",
          type: "EXPIRED_INSURANCE",
          displayText: "Bảo hiểm hết hạn",
          placeholder:
            "Vui lòng mô tả chi tiết về việc bảo hiểm xe đã hết hạn...",
        };
      case "FAKE_DOCUMENT":
        return {
          generalType: "SERIOUS_ERROR",
          type: "FAKE_DOCUMENT",
          displayText: "Khách cung cấp giấy tờ giả",
          placeholder:
            "Vui lòng mô tả chi tiết về giấy tờ giả mà khách hàng cung cấp...",
        };
      case "FAKE_ORDER":
        return {
          generalType: "SERIOUS_ERROR",
          type: "FAKE_ORDER",
          displayText: "Khách đặt đơn giả",
          placeholder:
            "Vui lòng mô tả chi tiết về hành vi đặt đơn giả của khách hàng...",
        };
      case "DISPUTE_REFUND":
        return {
          generalType: "SERIOUS_ERROR",
          type: "DISPUTE_REFUND",
          displayText: "Tranh chấp hoàn tiền/phạt",
          placeholder:
            "Vui lòng mô tả chi tiết về tranh chấp liên quan đến hoàn tiền hoặc phí phạt...",
        };
      case "DIRTY_CAR":
        return {
          generalType: "SERIOUS_ERROR",
          type: "DIRTY_CAR",
          displayText: "Xe bẩn",
          placeholder:
            "Vui lòng mô tả chi tiết về tình trạng xe bẩn khi trả lại...",
        };
      case "LATE_RETURN_NO_CONTACT":
        return {
          generalType: "SERIOUS_ERROR",
          type: "LATE_RETURN_NO_CONTACT",
          displayText: "Không trả xe đúng hạn và mất liên lạc",
          placeholder:
            "Vui lòng mô tả chi tiết về việc khách hàng không trả xe đúng hạn và không thể liên lạc...",
        };

      // NON-SERIOUS ERRORS
      case "INAPPROPRIATE":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "INAPPROPRIATE",
          displayText: "Ngôn từ không phù hợp",
          placeholder:
            "Vui lòng mô tả chi tiết về ngôn từ không phù hợp hoặc bạo lực...",
        };
      case "VIOLENCE":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "VIOLENCE",
          displayText: "Bạo lực",
          placeholder: "Vui lòng mô tả chi tiết về hành vi bạo lực...",
        };
      case "SPAM":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "SPAM",
          displayText: "Spam",
          placeholder: "Vui lòng mô tả chi tiết về hành vi spam...",
        };
      case "OTHERS":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "OTHERS",
          displayText: "Khác",
          placeholder: "Vui lòng mô tả chi tiết về vấn đề khác...",
        };
      case "MISLEADING_LISTING":
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "MISLEADING_LISTING",
          displayText: "Thông tin sai trong bài đăng",
          placeholder:
            "Vui lòng mô tả chi tiết về thông tin sai lệch trong bài đăng xe...",
        };

      // STAFF ERRORS
      case "STAFF_REPORT":
        return {
          generalType: "STAFF_ERROR",
          type: "STAFF_REPORT",
          displayText: "Báo cáo bởi nhân viên",
          placeholder: "Vui lòng mô tả chi tiết về vấn đề được báo cáo...",
        };

      // APPEAL
      case "APPEAL":
        return {
          generalType: "STAFF_ERROR",
          type: "APPEAL",
          displayText: "Khiếu nại",
          placeholder: "Vui lòng cung cấp đầy đủ lý do và bằng chứng",
        };

      default:
        console.log("Fell to default case for:", reportType);
        return {
          generalType: "NON_SERIOUS_ERROR",
          type: "OTHERS",
          displayText: "Khác",
          placeholder: "Vui lòng mô tả chi tiết...",
        };
    }
  };

  // Handle click report button
  const handleReportClick = () => {
    if (!isAuthenticated || !user) {
      // notification.warning({
      //   message: "Yêu cầu đăng nhập",
      //   description: "Bạn cần đăng nhập để có thể báo cáo vi phạm.",
      //   duration: 4,
      // });
      showWarning("Bạn cần đăng nhập để có thể báo cáo vi phạm.");
      return;
    }

    setIsModalVisible(true);
    // Set giá trị mặc định cho evidenceUrl nếu được truyền từ props
    if (evidenceUrl) {
      form.setFieldsValue({ evidenceUrl: evidenceUrl });
    }
  };

  const handleReport = async (values: {
    selectedReportType?: string;
    reason: string;
    evidenceUrl?: string; // Lấy từ form
  }) => {
    try {
      setLoading(true);

      // Lấy reportType từ form (nếu có selector) hoặc từ props
      const finalReportType = showTypeSelector
        ? values.selectedReportType
        : reportType;

      if (!finalReportType) {
        throw new Error("Vui lòng chọn loại báo cáo");
      }

      const config = getReportConfig(finalReportType);

      // Sử dụng evidenceUrl từ form hoặc từ props (ưu tiên từ form)
      const finalEvidenceUrl =
        values.evidenceUrl?.trim() || evidenceUrl?.trim();

      const reportData = {
        targetId,
        generalType: config.generalType,
        type: config.type,
        reason: values.reason,
        ...(finalEvidenceUrl && { evidenceUrl: finalEvidenceUrl }), // Chỉ thêm nếu có giá trị
        ...((config.generalType === "SERIOUS_ERROR" ||
          config.generalType === "STAFF_ERROR") &&
          booking && {
            booking,
          }),
      };

      await createReport(reportData);

      // notification.success({
      //   message: "Báo cáo thành công",
      //   description:
      //     "Chúng tôi sẽ xem xét báo cáo của bạn trong thời gian sớm nhất.",
      //   duration: 4,
      // });
      showSuccess("Báo cáo thành công");

      setIsModalVisible(false);
      form.resetFields();
      onModalClose?.();
    } catch (error: any) {
      showApiError(error);
      //showError("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Get placeholder text based on selected type
  const getPlaceholderText = (selectedType?: string) => {
    if (selectedType) {
      return getReportConfig(selectedType).placeholder;
    }
    if (reportType) {
      return getReportConfig(reportType).placeholder;
    }
    return "Vui lòng mô tả chi tiết...";
  };

  // Modal content component để tránh duplicate code
  const ModalContent = () => (
    <>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Báo cáo</h2>
      </div>

      <Form form={form} layout="vertical" onFinish={handleReport}>
        {/* Type selector hoặc fixed display */}
        {showTypeSelector && reportTypes ? (
          <Form.Item
            name="selectedReportType"
            label="Vui lòng chọn lí do"
            rules={[{ required: true, message: "Vui lòng chọn loại báo cáo" }]}
          >
            <Select placeholder="Chọn loại báo cáo">
              {reportTypes.map((type) => {
                const config = getReportConfig(type);
                return (
                  <Option key={type} value={type}>
                    {config.displayText}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        ) : (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vui lòng chọn lí do
            </label>
            <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed">
              {reportType ? getReportConfig(reportType).displayText : ""}
            </div>
          </div>
        )}

        {/* Reason textarea với dynamic placeholder */}
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.selectedReportType !== currentValues.selectedReportType
          }
        >
          {({ getFieldValue }) => (
            <Form.Item
              name="reason"
              label="Mô tả chi tiết"
              rules={[
                { required: true, message: "Vui lòng nhập lý do" },
                { min: 10, message: "Lý do phải có ít nhất 10 ký tự" },
                { max: 500, message: "Lý do không được vượt quá 500 ký tự" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder={getPlaceholderText(
                  getFieldValue("selectedReportType")
                )}
                className="resize-none"
                maxLength={500}
                showCount
              />
            </Form.Item>
          )}
        </Form.Item>

        {/* Link bằng chứng - Optional field */}
        <Form.Item
          name="evidenceUrl"
          label={
            <div className="flex items-center gap-2">
              <LinkOutlined />
              <span>Link bằng chứng (Tùy chọn)</span>
            </div>
          }
          initialValue={evidenceUrl}
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve(); // Cho phép trường rỗng

                // Kiểm tra có nhiều http:// hoặc https:// không
                const httpCount = (value.match(/https?:\/\//g) || []).length;
                if (httpCount > 1) {
                  return Promise.reject(
                    new Error("Chỉ được phép nhập 1 link duy nhất")
                  );
                }

                // Kiểm tra định dạng URL cơ bản
                const urlRegex = /^https?:\/\/.+/;
                if (!urlRegex.test(value)) {
                  return Promise.reject(
                    new Error(
                      "Vui lòng nhập đúng định dạng URL (bắt đầu bằng http:// hoặc https://)"
                    )
                  );
                }

                // Kiểm tra độ dài
                if (value.length > 500) {
                  return Promise.reject(
                    new Error("Link không được vượt quá 500 ký tự")
                  );
                }

                // Kiểm tra URL hợp lệ
                try {
                  new URL(value);
                  return Promise.resolve();
                } catch {
                  return Promise.reject(
                    new Error("Vui lòng nhập đúng định dạng URL")
                  );
                }
              },
            },
          ]}
        >
          <Input
            placeholder="Nhập một link bằng chứng"
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Guide text */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <InfoCircleOutlined className="text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Hướng dẫn cung cấp bằng chứng:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Tải ảnh/video lên Google Drive, Imgur, hoặc YouTube</li>
                <li>Đảm bảo link có thể truy cập công khai</li>
                <li>Bằng chứng rõ ràng giúp xử lý báo cáo nhanh hơn</li>
                <li>
                  Không bắt buộc nhưng được khuyến khích cho báo cáo nghiêm
                  trọng
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <Form.Item className="mb-0 mt-6">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full h-12 bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 rounded-md font-medium"
          >
            Gửi báo cáo
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  if (autoOpen) {
    return (
      <Modal
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
        className="report-modal"
        closeIcon={
          <CloseOutlined className="text-gray-500 hover:text-gray-700" />
        }
      >
        <ModalContent />
      </Modal>
    );
  }

  return (
    <>
      <Button
        type={type}
        size={size}
        icon={icon ? <FlagOutlined /> : undefined}
        onClick={handleReportClick}
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
        width={500}
        className="report-modal"
        closeIcon={
          <CloseOutlined className="text-gray-500 hover:text-gray-700" />
        }
      >
        <ModalContent />
      </Modal>
    </>
  );
}
