// VNPay Payment Types
export interface PaymentRequest {
  amout: number; // Số tiền thanh toán (VND)
  bankCode?: string; // Mã ngân hàng (tùy chọn)
  bookingId: string; // ID đơn đặt xe
}

export interface VNPayResponse {
  code: string; // Mã phản hồi
  message: string; // Thông báo
  paymentUrl: string; // URL chuyển hướng đến VNPay
}

export interface PaymentCallbackParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHashType?: string;
  vnp_SecureHash?: string;
}

export interface BookingPaymentData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  fullname: string;
  phone: string;
  address: string;
  pickupMethod: "office" | "delivery";
  couponId?: string;
  // Không bao gồm amount - sẽ được tính ở backend
}
