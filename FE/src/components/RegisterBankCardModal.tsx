"use client";

import { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Popconfirm,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { bankCard } from "@/types/bankCard";

const { Option } = Select;
const { Title } = Typography;

// Danh sách ngân hàng phổ biến tại Việt Nam
const bankOptions = [
  { value: "BIDV", label: "BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam" },
  {
    value: "Vietcombank",
    label: "Vietcombank - Ngân hàng Ngoại thương Việt Nam",
  },
  { value: "Techcombank", label: "Techcombank - Ngân hàng Kỹ thương Việt Nam" },
  { value: "MB Bank", label: "MB Bank - Ngân hàng Quân đội" },
  { value: "ACB", label: "ACB - Ngân hàng Á Châu" },
  { value: "TPBank", label: "TPBank - Ngân hàng Tiên Phong" },
  { value: "VPBank", label: "VPBank - Ngân hàng Việt Nam Thịnh Vượng" },
  {
    value: "Agribank",
    label: "Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn",
  },
  { value: "OCB", label: "OCB - Ngân hàng Phương Đông" },
];

interface RegisterBankCardModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (card: bankCard) => void;
  card: bankCard | null;
  mode: "add" | "edit";
}

const RegisterBankCardModal: React.FC<RegisterBankCardModalProps> = ({
  visible,
  onCancel,
  onSave,

  card,
  mode,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && mode === "edit" && card) {
      form.setFieldsValue({
        bankAccountName: card.bankAccountName || "",
        bankAccountNumber: card.bankAccountNumber || "",
        bankAccountType: card.bankAccountType || "",
      });
    } else if (visible && mode === "add") {
      form.resetFields();
    }
  }, [visible, card, mode, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const newCard: bankCard = {
        id: card?.id || "",
        bankAccountNumber: values.bankAccountNumber,
        bankAccountName: values.bankAccountName,
        bankAccountType: values.bankAccountType,
      };

      onSave(newCard);
    });
  };

  return (
    <Modal
      title={
        <Title level={4} className="mb-0">
          {mode === "add" ? "Thêm thẻ ngân hàng" : "Thông tin thẻ"}
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSubmit}
          style={{
            display:
              mode === "edit" || mode === "add" ? "inline-block" : "none",
          }}
        >
          Lưu
        </Button>,
      ]}
    >
      <div className="mt-4">
        <Title level={5} className="mb-4">
          Thông tin thẻ
        </Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            bankAccountName: "",
            bankAccountNumber: "",
            bankAccountType: "",
          }}
        >
          <Form.Item
            name="bankAccountType"
            label="Ngân hàng"
            rules={[{ required: true, message: "Vui lòng chọn ngân hàng" }]}
          >
            <Select
              placeholder="Chọn ngân hàng"
              showSearch
              optionFilterProp="children"
            >
              {bankOptions.map((bank) => (
                <Option key={bank.value} value={bank.value}>
                  {bank.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="bankAccountName"
            label="Tên chủ thẻ"
            rules={[{ required: true, message: "Vui lòng nhập tên chủ thẻ" }]}
          >
            <Input
              placeholder="LE DINH HIEU"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            name="bankAccountNumber"
            label="Số thẻ"
            rules={[
              { required: true, message: "Vui lòng nhập số thẻ" },
              { pattern: /^[0-9]{9,16}$/, message: "Số thẻ không hợp lệ" },
            ]}
          >
            <Input placeholder="4619370033035546" maxLength={16} />
          </Form.Item>

          <div className="text-sm text-gray-500 mb-6">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <a href="#" className="text-blue-600">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="#" className="text-blue-600">
              Chính sách riêng tư
            </a>{" "}
            về cách xử lý dữ liệu của bạn.
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default RegisterBankCardModal;
