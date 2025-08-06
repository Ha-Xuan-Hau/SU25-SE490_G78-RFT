"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Popconfirm,
  Checkbox,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { bankCard } from "@/types/bankCard";

const { Option } = Select;
const { Title } = Typography;

// Danh sách 49 ngân hàng tại Việt Nam ref: https://bankervn.com/danh-sach-ngan-hang/
const bankOptions = [
  { value: "VPBank", label: "VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  {
    value: "BIDV",
    label: "BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
  },
  {
    value: "Vietcombank",
    label: "Vietcombank - Ngân hàng TMCP Ngoại Thương Việt Nam",
  },
  {
    value: "VietinBank",
    label: "VietinBank - Ngân hàng TMCP Công thương Việt Nam",
  },
  { value: "MBBANK", label: "MBBANK - Ngân hàng TMCP Quân Đội" },
  { value: "ACB", label: "ACB - Ngân hàng TMCP Á Châu" },
  { value: "SHB", label: "SHB - Ngân hàng TMCP Sài Gòn – Hà Nội" },
  { value: "Techcombank", label: "Techcombank - Ngân hàng TMCP Kỹ Thương" },
  { value: "Agribank", label: "Agribank - Ngân hàng NN&PT Nông thôn Việt Nam" },
  {
    value: "HDBank",
    label: "HDBank - Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
  },
  {
    value: "LienVietPostBank",
    label: "LienVietPostBank - Ngân hàng TMCP Bưu điện Liên Việt",
  },
  { value: "VIB", label: "VIB - Ngân hàng TMCP Quốc Tế" },
  { value: "SeABank", label: "SeABank - Ngân hàng TMCP Đông Nam Á" },
  { value: "VBSP", label: "VBSP - Ngân hàng Chính sách xã hội Việt Nam" },
  { value: "TPBank", label: "TPBank - Ngân hàng TMCP Tiên Phong" },
  { value: "OCB", label: "OCB - Ngân hàng TMCP Phương Đông" },
  { value: "MSB", label: "MSB - Ngân hàng TMCP Hàng Hải" },
  {
    value: "Sacombank",
    label: "Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín",
  },
  { value: "Eximbank", label: "Eximbank - Ngân hàng TMCP Xuất Nhập Khẩu" },
  { value: "SCB", label: "SCB - Ngân hàng TMCP Sài Gòn" },
  { value: "VDB", label: "VDB - Ngân hàng Phát triển Việt Nam" },
  { value: "Nam A Bank", label: "Nam A Bank - Ngân hàng TMCP Nam Á" },
  { value: "ABBANK", label: "ABBANK - Ngân hàng TMCP An Bình" },
  {
    value: "PVcomBank",
    label: "PVcomBank - Ngân hàng TMCP Đại Chúng Việt Nam",
  },
  { value: "Bac A Bank", label: "Bac A Bank - Ngân hàng TMCP Bắc Á" },
  { value: "UOB", label: "UOB - Ngân hàng TNHH MTV UOB Việt Nam" },
  { value: "Woori", label: "Woori - Ngân hàng TNHH MTV Woori Việt Nam" },
  { value: "HSBC", label: "HSBC - Ngân hàng TNHH MTV HSBC Việt Nam" },
  {
    value: "SCBVL",
    label: "SCBVL - Ngân hàng TNHH MTV Standard Chartered Việt Nam",
  },
  { value: "PBVN", label: "PBVN - Ngân hàng TNHH MTV Public Bank Việt Nam" },
  { value: "SHBVN", label: "SHBVN - Ngân hàng TNHH MTV Shinhan Việt Nam" },
  { value: "NCB", label: "NCB - Ngân hàng TMCP Quốc dân" },
  { value: "VietABank", label: "VietABank - Ngân hàng TMCP Việt Á" },
  { value: "BVBank", label: "BVBank - Ngân hàng TMCP Bản Việt" },
  { value: "Vikki Bank", label: "Vikki Bank - Ngân hàng TNHH MTV Số Vikki" },
  { value: "Vietbank", label: "Vietbank - Ngân hàng TMCP Việt Nam Thương Tín" },
  { value: "ANZVL", label: "ANZVL - Ngân hàng TNHH MTV ANZ Việt Nam" },
  { value: "MBV", label: "MBV - Ngân hàng TNHH MTV Việt Nam Hiện Đại" },
  { value: "CIMB", label: "CIMB - Ngân hàng TNHH MTV CIMB Việt Nam" },
  { value: "Kienlongbank", label: "Kienlongbank - Ngân hàng TMCP Kiên Long" },
  { value: "IVB", label: "IVB - Ngân hàng TNHH Indovina" },
  { value: "BAOVIET Bank", label: "BAOVIET Bank - Ngân hàng TMCP Bảo Việt" },
  {
    value: "SAIGONBANK",
    label: "SAIGONBANK - Ngân hàng TMCP Sài Gòn Công Thương",
  },
  { value: "Co-opBank", label: "Co-opBank - Ngân hàng Hợp tác xã Việt Nam" },
  { value: "GPBank", label: "GPBank - Ngân hàng TNHH MTV Dầu khí toàn cầu" },
  { value: "VRB", label: "VRB - Ngân hàng Liên doanh Việt Nga" },
  {
    value: "VCBNeo",
    label: "VCBNeo - Ngân hàng TNHH MTV Ngoại thương Công nghệ số",
  },
  { value: "HLBVN", label: "HLBVN - Ngân hàng TNHH MTV Hong Leong Việt Nam" },
  {
    value: "PGBank",
    label: "PGBank - Ngân hàng TMCP Thịnh vượng và Phát triển",
  },
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

    // Reset checkboxes khi modal mở/đóng
    if (visible) {
      setTermsAccepted(false);
      setPrivacyAccepted(false);
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
    <>
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
            disabled={!termsAccepted || !privacyAccepted}
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

            {/* Thay thế div cũ bằng checkboxes */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Tôi đồng ý với{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Điều khoản dịch vụ
                  </button>
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Tôi đồng ý với{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Chính sách riêng tư
                  </button>
                </span>
              </div>
            </div>
          </Form>
        </div>
      </Modal>
      {/* Modal Điều khoản dịch vụ */}
      <Modal
        title="📋 Điều khoản dịch vụ"
        open={showTermsModal}
        onCancel={() => setShowTermsModal(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setShowTermsModal(false)}
          >
            Đóng
          </Button>,
        ]}
        width={700}
      >
        <div className="max-h-96 overflow-y-auto pr-2">
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              Bằng việc sử dụng chức năng lưu thông tin thẻ ngân hàng, bạn đồng
              ý với các điều khoản sau:
            </p>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                1. Phạm vi sử dụng
              </h4>
              <p>
                Dữ liệu thẻ ngân hàng được sử dụng duy nhất cho mục đích thanh
                toán hoặc rút tiền trong phạm vi hệ thống của chúng tôi.
              </p>
              <p>
                Khi bạn tạo một yêu cầu rút tiền, nhân viên sẽ sử dụng thông tin
                thẻ ngân hàng của bạn để xử lý giao dịch.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                2. Trách nhiệm của người dùng
              </h4>
              <p>
                Cung cấp thông tin chính xác về ngân hàng, tên chủ thẻ, và số
                thẻ.
              </p>
              <p className="mt-2">
                Đảm bảo bạn là người sở hữu hợp pháp của tài khoản ngân hàng
                được khai báo.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                3. Trách nhiệm của chúng tôi
              </h4>
              <p>
                Đảm bảo các biện pháp an ninh và mã hóa được áp dụng khi lưu trữ
                thông tin thẻ.
              </p>
              <p className="mt-2">
                Không chia sẻ, bán hoặc chuyển nhượng thông tin thẻ ngân hàng
                của bạn cho bên thứ ba mà không có sự đồng ý.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                4. Từ chối trách nhiệm
              </h4>
              <p>
                Chúng tôi không chịu trách nhiệm cho các rủi ro phát sinh từ lỗi
                cung cấp sai thông tin hoặc hành vi sử dụng trái phép tài khoản
                của bạn bởi bên thứ ba.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Chính sách riêng tư */}
      <Modal
        title="🔐 Chính sách quyền riêng tư"
        open={showPrivacyModal}
        onCancel={() => setShowPrivacyModal(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setShowPrivacyModal(false)}
          >
            Đóng
          </Button>,
        ]}
        width={700}
      >
        <div className="max-h-96 overflow-y-auto pr-2">
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của
              bạn. Chính sách này áp dụng cho mọi thông tin thẻ ngân hàng được
              lưu trữ.
            </p>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                1. Thông tin thu thập
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Tên ngân hàng</li>
                <li>Tên chủ thẻ</li>
                <li>Số thẻ ngân hàng</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                2. Cách sử dụng thông tin
              </h4>
              <p>Phục vụ các giao dịch nội bộ của hệ thống.</p>
              <p className="mt-2">
                Hỗ trợ xử lý giao dịch rút tiền của người dùng.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                3. Quyền của bạn
              </h4>
              <p>
                Bạn có quyền yêu cầu chỉnh sửa hoặc xóa thông tin thẻ bất kỳ lúc
                nào.
              </p>
              <p className="mt-2">
                Có thể liên hệ với bộ phận hỗ trợ để được giải đáp và xử lý
                khiếu nại liên quan đến thông tin cá nhân.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RegisterBankCardModal;
