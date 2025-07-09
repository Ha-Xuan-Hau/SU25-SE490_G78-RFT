"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button, Spin, message, Result, Card, Descriptions } from "antd";
import Link from "next/link";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

interface VNPayWalletResponse {
  vnp_ResponseCode: string;
  vnp_TxnRef: string;
  vnp_Amount: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_BankCode: string;
  vnp_PayDate: string;
  vnp_SecureHash: string;
}

const WalletCallback: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending"
  >("pending");
  const [paymentData, setPaymentData] = useState<VNPayWalletResponse | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleWalletCallback = async () => {
      try {
        // Lấy tất cả parameters từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const responseCode = urlParams.get("vnp_ResponseCode") || "";
        const txnRef = urlParams.get("vnp_TxnRef") || "";
        const amount = urlParams.get("vnp_Amount") || "";
        const orderInfo = urlParams.get("vnp_OrderInfo") || "";
        const transactionNo = urlParams.get("vnp_TransactionNo") || "";
        const bankCode = urlParams.get("vnp_BankCode") || "";
        const payDate = urlParams.get("vnp_PayDate") || "";
        const secureHash = urlParams.get("vnp_SecureHash") || "";

        // Tạo object payment data
        const paymentResponse: VNPayWalletResponse = {
          vnp_ResponseCode: responseCode,
          vnp_TxnRef: txnRef,
          vnp_Amount: amount,
          vnp_OrderInfo: orderInfo,
          vnp_TransactionNo: transactionNo,
          vnp_BankCode: bankCode,
          vnp_PayDate: payDate,
          vnp_SecureHash: secureHash,
        };

        setPaymentData(paymentResponse);

        // Xử lý response code
        if (responseCode === "00") {
          // Nạp tiền thành công
          setPaymentStatus("success");
          message.success("Nạp tiền vào ví thành công!");

          // Có thể gọi API để cập nhật số dư ví
          try {
            // await updateWalletBalance(txnRef, amount);
            console.log("Wallet top-up successful:", txnRef);
          } catch (error) {
            console.error("Error updating wallet balance:", error);
          }
        } else {
          // Nạp tiền thất bại
          setPaymentStatus("failed");
          const errorMsg = getErrorMessage(responseCode);
          setErrorMessage(errorMsg);
          message.error("Nạp tiền thất bại!");
        }
      } catch (error) {
        console.error("Error processing wallet callback:", error);
        setPaymentStatus("failed");
        setErrorMessage("Có lỗi xảy ra khi xử lý nạp tiền");
        message.error("Có lỗi xảy ra khi xử lý nạp tiền");
      } finally {
        setLoading(false);
      }
    };

    // Chỉ xử lý khi có parameters
    if (window.location.search) {
      handleWalletCallback();
    } else {
      setLoading(false);
      setPaymentStatus("failed");
      setErrorMessage("Không tìm thấy thông tin nạp tiền");
    }
  }, []);

  // Hàm lấy message lỗi theo response code
  const getErrorMessage = (responseCode: string): string => {
    const errorMessages: { [key: string]: string } = {
      "01": "Giao dịch chưa hoàn tất",
      "02": "Giao dịch lỗi",
      "04": "Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)",
      "05": "VNPAY đang xử lý",
      "06": "VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng",
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking",
      "13": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)",
      "65": "Giao dịch không thành công do tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày",
      "75": "Ngân hàng thanh toán đang bảo trì",
      "79": "Giao dịch không thành công do Quý khách nhập sai mật khẩu thanh toán quá số lần quy định",
      "99": "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    };

    return (
      errorMessages[responseCode] || `Lỗi không xác định (Mã: ${responseCode})`
    );
  };

  // Format số tiền từ VNPay (chia cho 100)
  const formatAmount = (amount: string): string => {
    if (!amount) return "0";
    const numericAmount = parseInt(amount) / 100;
    return numericAmount.toLocaleString("vi-VN");
  };

  // Format ngày thanh toán
  const formatPayDate = (payDate: string): string => {
    if (!payDate) return "";
    // VNPay format: yyyyMMddHHmmss
    const year = payDate.substring(0, 4);
    const month = payDate.substring(4, 6);
    const day = payDate.substring(6, 8);
    const hour = payDate.substring(8, 10);
    const minute = payDate.substring(10, 12);
    const second = payDate.substring(12, 14);

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            size="large"
          />
          <div className="mt-4 text-lg text-gray-600">
            Đang xử lý nạp tiền...
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Vui lòng không đóng trang này
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {paymentStatus === "success" && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            title="Nạp tiền thành công!"
            subTitle="Số tiền đã được cộng vào ví của bạn"
            extra={[
              <Link href="/profile/wallets" key="wallet">
                <Button type="primary" size="large">
                  Xem số dư ví
                </Button>
              </Link>,
              <Link href="/vehicles" key="continue">
                <Button size="large">Tiếp tục thuê xe</Button>
              </Link>,
            ]}
          >
            {paymentData && (
              <Card className="mt-6">
                <Descriptions
                  title="Chi tiết giao dịch nạp tiền"
                  bordered
                  column={1}
                >
                  <Descriptions.Item label="Mã giao dịch">
                    <span className="font-mono font-semibold">
                      {paymentData.vnp_TxnRef}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã giao dịch VNPay">
                    <span className="font-mono">
                      {paymentData.vnp_TransactionNo}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền nạp">
                    <span className="font-bold text-green-600 text-lg">
                      {formatAmount(paymentData.vnp_Amount)}₫
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngân hàng">
                    {paymentData.vnp_BankCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian nạp tiền">
                    {formatPayDate(paymentData.vnp_PayDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả">
                    {paymentData.vnp_OrderInfo}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <div className="font-semibold text-green-800 mb-1">
                    Nạp tiền hoàn tất
                  </div>
                  <div className="text-green-700 text-sm">
                    Số tiền đã được cộng vào ví RFT của bạn. Bạn có thể sử dụng
                    số dư này để thanh toán cho các đơn đặt xe.
                  </div>
                </div>
              </div>
            </div>
          </Result>
        )}

        {paymentStatus === "failed" && (
          <Result
            status="error"
            icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
            title="Nạp tiền thất bại"
            subTitle={errorMessage}
            extra={[
              <Link href="/profile/wallets" key="retry">
                <Button type="primary" size="large">
                  Thử lại nạp tiền
                </Button>
              </Link>,
              <Link href="/vehicles" key="home">
                <Button size="large">Về trang chủ</Button>
              </Link>,
            ]}
          >
            {paymentData && (
              <Card className="mt-6">
                <Descriptions title="Thông tin giao dịch" bordered column={1}>
                  <Descriptions.Item label="Mã giao dịch">
                    <span className="font-mono font-semibold">
                      {paymentData.vnp_TxnRef}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền">
                    <span className="font-bold text-red-600 text-lg">
                      {formatAmount(paymentData.vnp_Amount)}₫
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã lỗi">
                    <span className="text-red-600 font-semibold">
                      {paymentData.vnp_ResponseCode}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả">
                    {paymentData.vnp_OrderInfo}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white text-xs font-bold">?</span>
                </div>
                <div>
                  <div className="font-semibold text-yellow-800 mb-1">
                    Cần hỗ trợ?
                  </div>
                  <div className="text-yellow-700 text-sm">
                    Nếu bạn gặp vấn đề với nạp tiền, vui lòng liên hệ với chúng
                    tôi qua hotline hoặc email để được hỗ trợ.
                  </div>
                </div>
              </div>
            </div>
          </Result>
        )}
      </div>
    </div>
  );
};

export default WalletCallback;
