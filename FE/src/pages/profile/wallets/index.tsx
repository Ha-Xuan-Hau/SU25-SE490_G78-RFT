"use client";

import { useEffect, useState } from "react";
import {
  getUserWallet,
  updateUserWallet,
  withdrawFromWallet,
} from "@/apis/wallet.api";
import { createTopUpVNPay } from "@/apis/payment.api";
import { showError, showSuccess, showWarning } from "@/utils/toast.utils";
import { useUserState } from "@/recoils/user.state";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import {
  Button,
  Typography,
  Empty,
  Modal,
  Form,
  InputNumber,
  Tooltip,
  Spin,
  Row,
  Col,
} from "antd";
import {
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { bankCard } from "@/types/bankCard";
import RegisterBankCardModal from "@/components/RegisterBankCardModal";

const { Title } = Typography;

type WalletType = {
  balance?: number;
  cards?: bankCard[];
};

export default function UserWalletsPage() {
  const [user] = useUserState();
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
    if (!user?.id) return;
    setLoading(true);
    getUserWallet(user.id)
      .then((data: any) => {
        setWallet(data);
        // Nếu API trả về 1 object duy nhất, chuyển thành mảng cards
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
      })
      .catch((err: any) => showError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

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
      if (!user?.id) return;
      await updateUserWallet(user.id, card);
      showSuccess("Cập nhật tài khoản RFT thành công");
      // Sau khi cập nhật, reload lại dữ liệu ví/thẻ từ backend
      const data = await getUserWallet(user.id);
      setWallet(data);
      if (Array.isArray(data?.cards)) {
        setCards(data.cards);
      } else if (data?.id) {
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
        userId: user.id,
        amount: values.amount,
      });
      showSuccess("Gửi yêu cầu rút tiền thành công!");
      setIsWithdrawModalVisible(false);
      // Reload lại số dư ví và thẻ nếu cần
      getUserWallet(user.id)
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
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Đang tải thông tin ví...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <WalletOutlined className="text-green-600 text-lg" />
            </div>
            <Title level={4} className="m-0 text-gray-900">
              Tài Khoản RFT Của Tôi
            </Title>
          </div>

          <p className="text-gray-600 text-sm">
            Quản lý tài khoản và thực hiện các giao dịch nạp/rút tiền
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {cards.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <Row gutter={[16, 16]} align="middle">
                    {/* Card Info */}
                    <Col xs={24} lg={14}>
                      <div className="space-y-3">
                        {!card.bankAccountNumber ||
                        !card.bankAccountName ||
                        !card.bankAccountType ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-orange-500 font-medium">
                              Bạn chưa thiết lập thông tin thẻ ngân hàng
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-900 font-medium">
                                {card.bankAccountName ?? ""} -{" "}
                                {card.bankAccountType ?? ""}
                              </span>
                            </div>
                            <div className="ml-4 text-gray-600 font-mono">
                              {formatCardNumber(card.bankAccountNumber)}
                            </div>
                          </>
                        )}
                        <div className="ml-4">
                          <span className="text-sm text-gray-500">
                            Số dư hiện tại:{" "}
                          </span>
                          <span className="text-green-600 font-semibold text-lg">
                            {formatCurrency(card.balance)}
                          </span>
                        </div>
                      </div>
                    </Col>

                    {/* Action Buttons */}
                    <Col xs={24} lg={10}>
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Tooltip title="Xem thông tin thẻ">
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewCard(card)}
                            className="flex items-center justify-center"
                          >
                            <span className="hidden sm:inline ml-1">
                              Xem thẻ
                            </span>
                          </Button>
                        </Tooltip>

                        <Tooltip title="Nạp tiền vào tài khoản">
                          <Button
                            icon={<UploadOutlined />}
                            onClick={(e) => handleOpenDepositModal(card, e)}
                            type="primary"
                            className="flex items-center justify-center bg-green-500 hover:bg-green-600 border-none"
                          >
                            <span className="hidden sm:inline ml-1">
                              Nạp tiền
                            </span>
                          </Button>
                        </Tooltip>

                        <Tooltip title="Gửi yêu cầu rút tiền">
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={(e) => handleOpenWithdrawModal(card, e)}
                            type="primary"
                            danger
                            className="flex items-center justify-center"
                          >
                            <span className="hidden sm:inline ml-1">
                              Rút tiền
                            </span>
                          </Button>
                        </Tooltip>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12">
              <Empty
                description={
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa có tài khoản RFT
                    </h3>
                    <p className="text-gray-600">
                      Bạn chưa có tài khoản RFT nào trong hệ thống
                    </p>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                imageStyle={{ height: 120 }}
              />
            </div>
          )}
        </div>
      </div>

      <RegisterBankCardModal
        visible={isModalVisible}
        onCancel={handleCloseModal}
        onSave={handleSaveCard}
        card={currentCard}
        mode={modalMode}
      />

      {/* Modal nạp tiền */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UploadOutlined className="text-green-500" />
            <span>Nạp Tiền Vào Tài Khoản</span>
          </div>
        }
        open={isDepositModalVisible}
        onCancel={handleCloseDepositModal}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={depositForm}
          layout="vertical"
          onFinish={handleTopUp}
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
            label="Số tiền nạp"
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
            extra="Giới hạn 1 lần nạp là 10.000.000 VNĐ, nhập quá sẽ tự chuyển thành 10.000.000 VNĐ"
          >
            <InputNumber
              min={10000}
              max={10000000}
              placeholder="Nhập số tiền cần nạp"
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
              className="bg-green-500 hover:bg-green-600 border-none"
              size="large"
              block
              loading={topUpLoading}
              icon={<UploadOutlined />}
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
    </>
  );
}

UserWalletsPage.Layout = ProfileLayout;
