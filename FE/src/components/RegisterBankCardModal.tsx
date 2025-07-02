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
  onDelete: (cardId: string) => void;
  card: bankCard | null;
  mode: "add" | "edit";
}

const RegisterBankCardModal: React.FC<RegisterBankCardModalProps> = ({
  visible,
  onCancel,
  onSave,
  onDelete,
  card,
  mode,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && mode === "edit" && card) {
      form.setFieldsValue({
        cardHolderName: card.cardHolderName || "",
        cardNumber: card.cardNumber || "",
        bankName: card.bankName || "",
      });
    } else if (visible && mode === "add") {
      form.resetFields();
    }
  }, [visible, card, mode, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const newCard: bankCard = {
        id: card?.id || "",
        cardNumber: values.cardNumber,
        cardHolderName: values.cardHolderName,
        bankName: values.bankName,
      };

      onSave(newCard);
    });
  };

  const handleDelete = () => {
    if (card && card.id) {
      onDelete(card.id);
    }
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
      footer={null}
      width={600}
    >
      <div className="mt-4">
        <Title level={5} className="mb-4">
          Thông tin thẻ
        </Title>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            cardHolderName: "",
            cardNumber: "",
            bankName: "",
          }}
        >
          <Form.Item
            name="bankName"
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
            name="cardHolderName"
            label="Tên chủ thẻ"
            rules={[{ required: true, message: "Vui lòng nhập tên chủ thẻ" }]}
          >
            <Input
              placeholder="LE DINH HIEU"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            name="cardNumber"
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

          <div className="flex justify-between">
            <div>
              {mode === "edit" && (
                <Popconfirm
                  title="Xóa thẻ"
                  description="Bạn có chắc muốn xóa thẻ này không?"
                  onConfirm={handleDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              )}
            </div>
            <div>
              <Button style={{ marginRight: 8 }} onClick={onCancel}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSubmit}>
                Save
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default RegisterBankCardModal;
