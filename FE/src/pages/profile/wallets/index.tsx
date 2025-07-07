"use client";

import { useState, useEffect } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import {
  Button,
  Card,
  Typography,
  Empty,
  Skeleton,
  message,
  Modal,
  Form,
  InputNumber,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { bankCard } from "@/types/bankCard";
import RegisterBankCardModal from "@/components/RegisterBankCardModal";

const { Title } = Typography;

// Mock data cho các tài khoản ngân hàng
const mockCards: bankCard[] = [
  {
    id: "1",
    cardNumber: "4619370033035546",
    cardHolderName: "LE DINH HIEU",
    bankName: "BIDV - NH DAU TU & PHAT TRIEN VN",
    balance: 5000000,
  },
];

export default function WalletsPage() {
  // States for cards
  const [cards, setCards] = useState<bankCard[]>([]);
  const [loading, setLoading] = useState(true);

  // States for modals
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);

  // State for the current card being edited/viewed/deposited/withdrawn
  const [currentCard, setCurrentCard] = useState<bankCard | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  // Form for deposit and withdraw
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();

  useEffect(() => {
    // Giả lập API call
    const fetchCards = () => {
      setTimeout(() => {
        setCards(mockCards);
        setLoading(false);
      }, 1000);
    };

    fetchCards();
  }, []);

  const handleAddCard = () => {
    setModalMode("add");
    setCurrentCard(null);
    setIsModalVisible(true);
  };

  const handleViewCard = (card: bankCard) => {
    setModalMode("edit");
    setCurrentCard(card);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveCard = (card: bankCard) => {
    if (modalMode === "add") {
      // Thêm thẻ mới
      const newCard = {
        ...card,
        id: (cards.length + 1).toString(),
        default: cards.length === 0, // Nếu là thẻ đầu tiên, set làm mặc định
        verified: false,
        balance: 0,
      };
      setCards([...cards, newCard]);
      message.success("Thêm tài khoản ngân hàng thành công");
    } else {
      // Cập nhật thẻ hiện tại
      setCards(cards.map((c) => (c.id === card.id ? { ...c, ...card } : c)));
      message.success("Cập nhật tài khoản ngân hàng thành công");
    }
    setIsModalVisible(false);
  };

  // Thêm hàm handleDeleteCard để xử lý việc xóa thẻ
  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId));
    setIsModalVisible(false);
    message.success("Xóa tài khoản ngân hàng thành công");
  };

  // Xử lý mở modal nạp tiền
  const handleOpenDepositModal = (card: bankCard, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn hành vi click vào thẻ
    setCurrentCard(card);
    setIsDepositModalVisible(true);
    depositForm.resetFields();
  };

  // Xử lý đóng modal nạp tiền
  const handleCloseDepositModal = () => {
    setIsDepositModalVisible(false);
    setCurrentCard(null);
  };

  // Xử lý nạp tiền
  const handleDeposit = () => {
    depositForm.validateFields().then((values) => {
      const depositAmount = values.amount;
      if (currentCard) {
        const currentBalance = currentCard.balance || 0;
        setCards(
          cards.map((card) =>
            card.id === currentCard.id
              ? { ...card, balance: currentBalance + depositAmount }
              : card
          )
        );
        message.success(
          `Nạp ${formatCurrency(depositAmount)} vào tài khoản thành công!`
        );
        setIsDepositModalVisible(false);
      }
    });
  };

  // Xử lý mở modal rút tiền
  const handleOpenWithdrawModal = (card: bankCard, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn hành vi click vào thẻ
    setCurrentCard(card);
    setIsWithdrawModalVisible(true);
    withdrawForm.resetFields();
  };

  // Xử lý đóng modal rút tiền
  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalVisible(false);
    setCurrentCard(null);
  };

  // Xử lý rút tiền
  const handleWithdraw = () => {
    withdrawForm.validateFields().then((values) => {
      const withdrawAmount = values.amount;
      if (currentCard) {
        const currentBalance = currentCard.balance || 0;
        if (withdrawAmount > currentBalance) {
          message.error("Số dư không đủ để thực hiện giao dịch này");
          return;
        }

        setCards(
          cards.map((card) =>
            card.id === currentCard.id
              ? { ...card, balance: currentBalance - withdrawAmount }
              : card
          )
        );
        message.success(
          `Rút ${formatCurrency(withdrawAmount)} từ tài khoản thành công!`
        );
        setIsWithdrawModalVisible(false);
      }
    });
  };

  // Function for future use to set a card as default
  // const handleSetDefault = (cardId: string, e?: React.MouseEvent) => {
  //   if (e) {
  //     e.stopPropagation(); // Ngăn chặn sự kiện click lan tỏa lên parent
  //   }
  //
  //   setCards(
  //     cards.map((card) => ({
  //       ...card,
  //       default: card.id === cardId,
  //     }))
  //   );
  //   message.success("Đã thiết lập tài khoản mặc định");
  // };

  // Hàm để hiển thị số tài khoản được che
  const formatCardNumber = (cardNumber: string) => {
    const last4 = cardNumber.slice(-4);
    return `* ${last4}`;
  };

  // Format số tiền VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card className="rounded-lg p-8">
        <div className="wallet-page">
          <div className="mb-6 flex items-center justify-between">
            <Title level={4} className="m-0">
              Tài Khoản Ngân Hàng Của Tôi
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCard}
              className="bg-red-500 hover:bg-red-600 border-none"
            >
              Thêm Ngân Hàng Liên Kết
            </Button>
          </div>

          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : cards.length > 0 ? (
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-grow">
                      <div className="mt-1 text-gray-700">
                        {card.cardHolderName} - {card.bankName}
                      </div>
                      <div className="mt-1 text-gray-700">
                        {formatCardNumber(card.cardNumber)}
                      </div>
                      <div className="mt-1 text-green-600 font-medium">
                        Số dư: {formatCurrency(card.balance || 0)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                      <Tooltip title="Xem thẻ">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => handleViewCard(card)}
                          className="flex items-center"
                        >
                          Xem thẻ
                        </Button>
                      </Tooltip>
                      <Tooltip title="Nạp tiền">
                        <Button
                          icon={<UploadOutlined />}
                          onClick={(e) => handleOpenDepositModal(card, e)}
                          type="primary"
                          className="flex items-center bg-green-500 hover:bg-green-600 border-none"
                        >
                          Nạp tiền
                        </Button>
                      </Tooltip>
                      <Tooltip title="Rút tiền">
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={(e) => handleOpenWithdrawModal(card, e)}
                          type="primary"
                          danger
                          className="flex items-center"
                        >
                          Rút tiền
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              description="Bạn chưa có tài khoản ngân hàng nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={handleAddCard}
                className="bg-red-500 hover:bg-red-600 border-none"
              >
                Thêm Ngân Hàng Liên Kết
              </Button>
            </Empty>
          )}

          {/* Modal thêm/sửa thẻ */}
          <RegisterBankCardModal
            visible={isModalVisible}
            onCancel={handleCloseModal}
            onSave={handleSaveCard}
            onDelete={handleDeleteCard}
            card={currentCard}
            mode={modalMode}
          />

          {/* Modal nạp tiền */}
          <Modal
            title="Nạp Tiền Vào Tài Khoản"
            open={isDepositModalVisible}
            onCancel={handleCloseDepositModal}
            footer={null}
          >
            <Form
              form={depositForm}
              layout="vertical"
              onFinish={handleDeposit}
              initialValues={{ amount: null }}
            >
              {currentCard && (
                <div className="mb-4">
                  <p className="font-medium">{currentCard.bankName}</p>
                  <p>Chủ thẻ: {currentCard.cardHolderName}</p>
                  <p>Số thẻ: {formatCardNumber(currentCard.cardNumber)}</p>
                  <p className="text-green-600">
                    Số dư hiện tại: {formatCurrency(currentCard.balance || 0)}
                  </p>
                </div>
              )}
              <Form.Item
                label="Số Tiền"
                name="amount"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số tiền",
                  },
                  {
                    type: "number",
                    max: 10000000,
                    message: "Số tiền tối đa là 10.000.000 VNĐ",
                  },
                ]}
              >
                <InputNumber
                  min={10000}
                  max={10000000}
                  placeholder="Nhập số tiền cần nạp"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `₫ ${value}`.replace(/\B(?=(?:\d{3})+(?!\d))/g, ".")
                  }
                  parser={() => 0 as any}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="bg-green-500 hover:bg-green-600 border-none"
                  block
                >
                  Xác Nhận Nạp Tiền
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal rút tiền */}
          <Modal
            title="Rút Tiền Từ Tài Khoản"
            open={isWithdrawModalVisible}
            onCancel={handleCloseWithdrawModal}
            footer={null}
          >
            <Form
              form={withdrawForm}
              layout="vertical"
              onFinish={handleWithdraw}
              initialValues={{ amount: null }}
            >
              {currentCard && (
                <div className="mb-4">
                  <p className="font-medium">{currentCard.bankName}</p>
                  <p>Chủ thẻ: {currentCard.cardHolderName}</p>
                  <p>Số thẻ: {formatCardNumber(currentCard.cardNumber)}</p>
                  <p className="text-green-600">
                    Số dư hiện tại: {formatCurrency(currentCard.balance || 0)}
                  </p>
                </div>
              )}
              <Form.Item
                label="Số Tiền"
                name="amount"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số tiền",
                  },
                  {
                    type: "number",
                    max: 10000000,
                    message: "Số tiền tối đa là 10.000.000 VNĐ",
                  },
                  () => ({
                    validator(_, value) {
                      if (currentCard && value > (currentCard.balance || 0)) {
                        return Promise.reject(
                          "Số dư không đủ để thực hiện giao dịch này"
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={10000}
                  max={10000000}
                  placeholder="Nhập số tiền cần rút"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `₫ ${value}`.replace(/\B(?=(?:\d{3})+(?!\d))/g, ".")
                  }
                  parser={() => 0 as unknown as number}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" danger block>
                  Xác Nhận Rút Tiền
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Card>
    </>
  );
}

WalletsPage.Layout = ProfileLayout;
