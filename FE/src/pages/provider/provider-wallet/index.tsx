"use client";

import { useEffect, useState } from "react";
import {
  getUserWallet,
  updateUserWallet,
  withdrawFromWallet,
} from "@/apis/wallet.api";
import { createTopUpVNPay } from "@/apis/payment.api";
import { showError, showSuccess, showWarning } from "@/utils/toast.utils";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import {
  Button,
  Card,
  Typography,
  Empty,
  Modal,
  Form,
  InputNumber,
  Tooltip,
  Spin,
  message,
} from "antd";
import {
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { bankCard } from "@/types/bankCard";
import RegisterBankCardModal from "@/components/RegisterBankCardModal";
import { useProviderState } from "@/recoils/provider.state";

const { Title } = Typography;

type WalletType = {
  balance?: number;
  cards?: bankCard[];
};

export default function ProviderWalletsPage() {
  const [provider] = useProviderState();
  const [wallet, setWallet] = useState<WalletType | null>(null);

  // States for cards
  const [cards, setCards] = useState<bankCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States for modals
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDepositModalVisible, setIsDepositModalVisible] =
    useState<boolean>(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] =
    useState<boolean>(false);

  // State for the current card being edited/viewed/deposited/withdrawn
  const [currentCard, setCurrentCard] = useState<bankCard | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  // Form for deposit and withdraw
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [topUpLoading, setTopUpLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!provider?.id) return;
    setLoading(true);
    getUserWallet(provider.id)
      .then((data: any) => {
        setWallet(data);
        // Nếu API trả về 1 object duy nhất, chuyển thành mảng cards
        if (Array.isArray(data?.cards)) {
          setCards(data.cards);
        } else if (data?.id) {
          // Chỉ cần có id ví là tạo 1 card
          setCards([
            {
              id: data.id || "1",
              bankAccountNumber: data.bankAccountNumber,
              bankAccountName: data.bankAccountName,
              bankAccountType: data.bankAccountType,
              balance: data.balance,
            },
          ]);
        } else {
          setCards([]);
        }
      })
      .catch((err: any) => showError(err.message))
      .finally(() => setLoading(false));
  }, [provider]);

  const handleViewCard = (card: bankCard) => {
    setModalMode("edit");
    setCurrentCard(card);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveCard = async (card: bankCard) => {
    try {
      if (!provider?.id) return;
      await updateUserWallet(provider.id, card);
      showSuccess("Cập nhật tài khoản RFT thành công");
      // Sau khi cập nhật, reload lại dữ liệu ví/thẻ từ backend
      const data = await getUserWallet(provider.id);
      setWallet(data);
      if (Array.isArray(data?.cards)) {
        setCards(data.cards);
      } else if (data?.bankAccountNumber) {
        setCards([
          {
            id: data.id || "1",
            bankAccountNumber: data.bankAccountNumber,
            bankAccountName: data.bankAccountName,
            bankAccountType: data.bankAccountType,
            balance: data.balance,
          },
        ]);
      } else {
        setCards([]);
      }
      setIsModalVisible(false);
    } catch (err: any) {
      showError(err.message || "Cập nhật tài khoản RFT thất bại!");
    }
  };

  // Mở modal nạp tiền
  const handleOpenDepositModal = (card: bankCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentCard(card);
    setIsDepositModalVisible(true);
    depositForm.resetFields();
  };

  // Đóng modal nạp tiền
  const handleCloseDepositModal = () => {
    setIsDepositModalVisible(false);
    setCurrentCard(null);
  };

  // Nạp tiền qua VNPay (API thật)
  const handleTopUp = async (values: { amount: number }) => {
    if (
      !values.amount ||
      isNaN(Number(values.amount)) ||
      Number(values.amount) <= 0
    ) {
      showError("Vui lòng nhập số tiền hợp lệ!");
      return;
    }
    setTopUpLoading(true);
    try {
      const paymentData = {
        amount: Number(values.amount),
        bankCode: "", // Nếu không chọn ngân hàng, để rỗng
      };
      const res = (await createTopUpVNPay(paymentData)) as {
        paymentUrl?: string;
      };
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        showError("Không tạo được link thanh toán!");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setTopUpLoading(false);
      setIsDepositModalVisible(false);
    }
  };

  // Mở modal rút tiền
  const handleOpenWithdrawModal = (card: bankCard, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if the card has the required fields
    if (
      !card.bankAccountNumber ||
      !card.bankAccountName ||
      !card.bankAccountType
    ) {
      showWarning(
        "Vui lòng cập nhật thông tin thẻ ngân hàng trước khi thực hiện rút tiền."
      );
      return; // Prevent opening the modal
    }

    setCurrentCard(card);
    setIsWithdrawModalVisible(true);
    withdrawForm.resetFields();
  };

  // Đóng modal rút tiền
  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalVisible(false);
    setCurrentCard(null);
  };

  // Rút tiền (API thật)
  const handleWithdraw = async (values: { amount: number }) => {
    try {
      if (!currentCard) return;
      setTopUpLoading(true);
      await withdrawFromWallet({
        userId: provider.id,
        amount: values.amount,
      });
      showSuccess("Gửi yêu cầu rút tiền thành công!");
      setIsWithdrawModalVisible(false);
      // Reload lại số dư ví và thẻ nếu cần
      getUserWallet(provider.id)
        .then((data: WalletType) => {
          setWallet(data);
          if (Array.isArray(data?.cards)) setCards(data.cards);
        })
        .catch((err: any) => showError(err.message));
    } catch (err: any) {
      showError(err.message || "Gửi yêu cầu rút tiền thất bại!");
    } finally {
      setTopUpLoading(false);
    }
  };

  // Hiển thị số tài khoản được che
  const formatCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return "*";
    const last4 = cardNumber.slice(-4);
    return `* ${last4}`;
  };

  // Format số tiền VND
  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  // Đúng type cho parser của InputNumber
  const numberParser = (value?: string): number => {
    if (!value) return 0;
    const parsed = Number(value.replace(/[₫\s.]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }
  return (
    <>
      <Card className="rounded-lg p-8">
        <div className="wallet-page">
          <div className="mb-6 flex items-center justify-between">
            <Title level={4} className="m-0">
              Tài Khoản RFT Của Tôi
            </Title>
          </div>

          {cards.length > 0 ? (
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-grow">
                      {!card.bankAccountNumber ||
                      !card.bankAccountName ||
                      !card.bankAccountType ? (
                        <div className="text-orange-500 font-medium mb-2">
                          Bạn chưa thiết lập thông tin thẻ ngân hàng
                        </div>
                      ) : (
                        <>
                          <div className="mt-1 text-gray-700">
                            {card.bankAccountName ?? ""} -{" "}
                            {card.bankAccountType ?? ""}
                          </div>
                          <div className="mt-1 text-gray-700">
                            {formatCardNumber(card.bankAccountNumber)}
                          </div>
                        </>
                      )}
                      <div className="mt-1 text-green-600 font-medium">
                        Số dư: {formatCurrency(card.balance)}
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
                      <Tooltip title="Gửi yêu cầu rút tiền">
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
              description="Bạn chưa có tài khoản RFT nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            ></Empty>
          )}

          <RegisterBankCardModal
            visible={isModalVisible}
            onCancel={handleCloseModal}
            onSave={handleSaveCard}
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
              onFinish={handleTopUp}
              initialValues={{ amount: null }}
            >
              {currentCard && (
                <div className="mb-4">
                  <p className="font-medium">
                    {currentCard.bankAccountType ?? ""}
                  </p>
                  <p>Chủ thẻ: {currentCard.bankAccountName ?? ""}</p>
                  <p>
                    Số tài khoản:{" "}
                    {formatCardNumber(currentCard.bankAccountNumber)}
                  </p>
                  <p className="text-green-600">
                    Số dư hiện tại: {formatCurrency(currentCard.balance)}
                  </p>
                </div>
              )}
              <Form.Item
                label="Giới hạn 1 lần nạp là 10.000.000 VNĐ, nhập quá sẽ tự chuyển thành 10.000.000 VNĐ"
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
                  parser={numberParser}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="bg-green-500 hover:bg-green-600 border-none"
                  block
                  loading={topUpLoading}
                >
                  Xác Nhận Nạp Tiền
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal rút tiền */}
          <Modal
            title={
              <div className="flex items-center gap-2">
                <DownloadOutlined className="text-red-500" />
                <span>Rút Tiền Từ Tài Khoản</span>
              </div>
            }
            open={isWithdrawModalVisible}
            onCancel={handleCloseWithdrawModal}
            footer={null}
            width={500}
            centered
          >
            <Form
              form={withdrawForm}
              layout="vertical"
              onFinish={handleWithdraw}
              initialValues={{ amount: null }}
            >
              {currentCard && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Thông tin tài khoản
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Loại tài khoản:</span>{" "}
                      {currentCard.bankAccountType ?? ""}
                    </p>
                    <p>
                      <span className="font-medium">Chủ thẻ:</span>{" "}
                      {currentCard.bankAccountName ?? ""}
                    </p>
                    <p>
                      <span className="font-medium">Số tài khoản:</span>{" "}
                      {formatCardNumber(currentCard.bankAccountNumber)}
                    </p>
                    <p className="text-green-600 font-medium">
                      <span className="text-gray-600 font-normal">
                        Số dư hiện tại:
                      </span>{" "}
                      {formatCurrency(currentCard.balance)}
                    </p>
                  </div>
                </div>
              )}

              <Form.Item
                label="Số tiền rút"
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
                      if (
                        currentCard &&
                        typeof value === "number" &&
                        value > (currentCard.balance ?? 0)
                      ) {
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
                  size="large"
                  formatter={(value) =>
                    `₫ ${value}`.replace(/\B(?=(?:\d{3})+(?!\d))/g, ".")
                  }
                  parser={numberParser}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  danger
                  size="large"
                  block
                  loading={topUpLoading}
                  icon={<DownloadOutlined />}
                >
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

ProviderWalletsPage.Layout = ProviderLayout;
