"use client";

import { useState, useEffect } from "react";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { Button, Card, Typography, Empty, Skeleton, message, Tag } from "antd";
import { PlusOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { bankCard } from "@/types/bankCard";
import RegisterBankCardModal from "@/components/RegisterBankCardModal";

const { Title, Text } = Typography;

// Mock data cho các tài khoản ngân hàng
const mockCards: bankCard[] = [
  {
    id: "1",
    cardNumber: "4619370033035546",
    cardHolderName: "LE DINH HIEU",
    bankName: "BIDV - NH DAU TU & PHAT TRIEN VN",
    balance: 5000000,
  },
  {
    id: "2",
    cardNumber: "4111111100000660",
    cardHolderName: "NGUYEN VAN A",
    bankName: "MB Bank",
    balance: 0,
  },
];

export default function WalletsPage() {
  const [cards, setCards] = useState<bankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<bankCard | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

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

  const handleSetDefault = (cardId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Ngăn chặn sự kiện click lan tỏa lên parent
    }

    setCards(
      cards.map((card) => ({
        ...card,
        default: card.id === cardId,
      }))
    );
    message.success("Đã thiết lập tài khoản mặc định");
  };

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
                  className="border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewCard(card)}
                >
                  <div className="flex items-center">
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
        </div>
      </Card>
    </>
  );
}

WalletsPage.Layout = ProfileLayout;
