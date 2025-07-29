"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { CreditCard, Wallet, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { showSuccess, showError, showInfo } from "@/utils/toast.utils";
import { payWithWallet, createVNPayPayment } from "@/apis/booking.api";
import { getUserWallet } from "@/apis/wallet.api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  booking: {
    _id: string;
    totalCost: number;
  };
  onPaymentSuccess: () => void;
}

interface WalletData {
  id: string;
  userId: string;
  balance: number;
  bankAccountNumber: string;
  bankAccountName: string;
  bankAccountType: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  booking,
  onPaymentSuccess,
}) => {
  const { user } = useAuth(); // Get user from auth context
  const [paymentMethod, setPaymentMethod] = useState<string>("VNPAY");
  const [loading, setLoading] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  // Fetch wallet data when modal opens
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.id) {
        showError("Không tìm thấy thông tin người dùng");
        return;
      }

      setLoadingBalance(true);
      try {
        const response = await getUserWallet(user.id);

        // Check if response has the expected structure
        if (response && response.balance !== undefined) {
          setWalletData(response);
        } else {
          showError("Không thể tải thông tin ví");
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        showError("Không thể tải thông tin ví");
      } finally {
        setLoadingBalance(false);
      }
    };

    if (visible && user?.id) {
      fetchWalletData();
    }
  }, [visible, user?.id]);

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (paymentMethod === "WALLET") {
        // Check wallet balance
        if (!walletData || walletData.balance < booking.totalCost) {
          showError("Số dư ví không đủ để thanh toán");
          return;
        }

        // Pay with wallet
        const response = (await payWithWallet(booking._id)) as {
          success: boolean;
          error?: string;
        };

        if (response.success) {
          showSuccess("Thanh toán ví thành công!");
          onPaymentSuccess();
          onClose();
        } else {
          showError(response.error || "Lỗi thanh toán ví");
        }
      } else if (paymentMethod === "VNPAY") {
        // Create VNPay payment
        const response = (await createVNPayPayment(
          booking._id,
          booking.totalCost
        )) as {
          success: boolean;
          data?: { paymentUrl: string };
          error?: string;
        };

        if (response.success && response.data?.paymentUrl) {
          showInfo("Chuyển hướng đến VNPay...");
          // Redirect to VNPay
          window.location.href = response.data.paymentUrl;
        } else {
          showError(response.error || "Lỗi tạo link thanh toán");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      showError("Lỗi trong quá trình thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const walletBalance = walletData?.balance || 0;

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Thanh toán đơn hàng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order info */}
          <Card className="bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">
                  Mã đơn hàng:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                    #{booking._id}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-800 dark:text-gray-200">
                  Số tiền cần thanh toán:
                </span>
                <span className="text-red-600 dark:text-red-400">
                  {formatCurrency(booking.totalCost)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment methods */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Phương thức thanh toán
            </h3>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-3"
            >
              {/* VNPay Option */}
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="VNPAY"
                  id="vnpay"
                  className="flex-shrink-0"
                />
                <Card
                  className={cn(
                    "flex-1 cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600",
                    paymentMethod === "VNPAY" &&
                      "border-blue-500 ring-2 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
                  )}
                  onClick={() => setPaymentMethod("VNPAY")}
                >
                  <CardContent className="flex items-center p-4">
                    <div className="flex items-center space-x-3 w-full">
                      <CreditCard className="h-6 w-6 text-blue-500 flex-shrink-0 dark:text-blue-400" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          VNPay
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Thẻ ATM, Visa, MasterCard, QR Code
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Option */}
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="WALLET"
                  id="wallet"
                  className="flex-shrink-0"
                />
                <Card
                  className={cn(
                    "flex-1 cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600",
                    paymentMethod === "WALLET" &&
                      "border-blue-500 ring-2 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
                  )}
                  onClick={() => setPaymentMethod("WALLET")}
                >
                  <CardContent className="flex items-center p-4">
                    <div className="flex items-center space-x-3 w-full">
                      <Wallet className="h-6 w-6 text-green-500 flex-shrink-0 dark:text-green-400" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Ví RFT
                        </div>
                        <div className="text-sm">
                          {loadingBalance ? (
                            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Đang tải...</span>
                            </div>
                          ) : walletData ? (
                            <>
                              <span className="text-gray-500 dark:text-gray-400">
                                Số dư:{" "}
                              </span>
                              <span
                                className={`font-medium ${
                                  walletBalance >= booking.totalCost
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {formatCurrency(walletBalance)}
                              </span>
                              <div className="text-xs text-gray-400 mt-1">
                                {walletData.bankAccountType} -{" "}
                                {walletData.bankAccountName}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              Không thể tải thông tin ví
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>

            {/* Insufficient balance warning */}
            {paymentMethod === "WALLET" &&
              walletData &&
              walletBalance < booking.totalCost && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3 dark:bg-red-950 dark:border-red-700">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-red-600 text-sm dark:text-red-400">
                      Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền
                      hoặc chọn phương thức khác.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handlePayment}
            disabled={
              loading ||
              (paymentMethod === "WALLET" &&
                (!walletData || walletBalance < booking.totalCost))
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {paymentMethod === "WALLET" ? "Thanh toán" : "Thanh toán qua VNPay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
