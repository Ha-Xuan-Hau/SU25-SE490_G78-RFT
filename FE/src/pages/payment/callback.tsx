// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { Spin, Result, Button } from "antd";
// import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
// import { handleVNPayCallback } from "@/apis/payment.api";
// import { updateBookingPaymentStatus, getBookingById } from "@/apis/booking.api";
// import { VNPAY_RESPONSE_CODES } from "@/apis/payment.api";

// const PaymentCallbackPage = () => {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [paymentResult, setPaymentResult] = useState(null);
//   const [bookingData, setBookingData] = useState(null);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const processPaymentCallback = async () => {
//       try {
//         // Lấy tất cả query parameters từ VNPay callback
//         const callbackParams = router.query;

//         if (Object.keys(callbackParams).length === 0) {
//           return; // Chưa có params, đợi router load
//         }

//         console.log("VNPay callback params:", callbackParams);

//         // Xử lý callback với backend
//         const callbackResult = await handleVNPayCallback(callbackParams);
//         setPaymentResult(callbackResult);

//         // Lấy bookingId từ vnp_TxnRef hoặc từ URL params
//         const bookingId = callbackParams.bookingId || callbackParams.vnp_TxnRef;

//         if (bookingId) {
//           // Lấy thông tin booking
//           const booking = await getBookingById(bookingId);
//           setBookingData(booking);

//           // Cập nhật trạng thái thanh toán
//           const paymentStatus =
//             callbackParams.vnp_ResponseCode === VNPAY_RESPONSE_CODES.SUCCESS
//               ? "PAID"
//               : "FAILED";

//           await updateBookingPaymentStatus(
//             bookingId,
//             paymentStatus,
//             callbackParams
//           );
//         }
//       } catch (err) {
//         console.error("Lỗi xử lý callback thanh toán:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (router.isReady) {
//       processPaymentCallback();
//     }
//   }, [router.isReady, router.query]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Result
//           status="error"
//           title="Lỗi xử lý thanh toán"
//           subTitle={error}
//           extra={[
//             <Button type="primary" key="home" onClick={() => router.push("/")}>
//               Về trang chủ
//             </Button>,
//             <Button key="support" onClick={() => router.push("/support")}>
//               Liên hệ hỗ trợ
//             </Button>,
//           ]}
//         />
//       </div>
//     );
//   }

//   const isSuccess =
//     router.query.vnp_ResponseCode === VNPAY_RESPONSE_CODES.SUCCESS;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="max-w-md w-full mx-4">
//         <Result
//           status={isSuccess ? "success" : "error"}
//           icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//           title={isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
//           subTitle={
//             isSuccess
//               ? `Đơn đặt xe của bạn đã được thanh toán thành công. Mã giao dịch: ${
//                   router.query.vnp_TransactionNo || "N/A"
//                 }`
//               : `Thanh toán không thành công. Mã lỗi: ${router.query.vnp_ResponseCode}`
//           }
//           extra={[
//             isSuccess ? (
//               <Button
//                 type="primary"
//                 key="booking"
//                 onClick={() =>
//                   router.push(
//                     `/booking-details/${
//                       router.query.bookingId || router.query.vnp_TxnRef
//                     }`
//                   )
//                 }
//               >
//                 Xem chi tiết đặt xe
//               </Button>
//             ) : (
//               <Button
//                 type="primary"
//                 key="retry"
//                 onClick={() =>
//                   router.push(`/booking/${bookingData?.vehicleId || ""}`)
//                 }
//               >
//                 Thử lại thanh toán
//               </Button>
//             ),
//             <Button key="home" onClick={() => router.push("/")}>
//               Về trang chủ
//             </Button>,
//           ]}
//         />

//         {/* Hiển thị thông tin chi tiết thanh toán */}
//         {isSuccess && router.query && (
//           <div className="mt-8 bg-white p-4 rounded-lg shadow">
//             <h3 className="text-lg font-semibold mb-4">Chi tiết giao dịch</h3>
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Mã giao dịch:</span>
//                 <span className="font-medium">
//                   {router.query.vnp_TransactionNo}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Số tiền:</span>
//                 <span className="font-medium">
//                   {router.query.vnp_Amount
//                     ? (parseInt(router.query.vnp_Amount) / 100).toLocaleString(
//                         "vi-VN",
//                         {
//                           style: "currency",
//                           currency: "VND",
//                         }
//                       )
//                     : "N/A"}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Ngân hàng:</span>
//                 <span className="font-medium">
//                   {router.query.vnp_BankCode || "VNPay"}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Thời gian:</span>
//                 <span className="font-medium">
//                   {router.query.vnp_PayDate
//                     ? new Date(
//                         router.query.vnp_PayDate.substring(0, 4) +
//                           "-" +
//                           router.query.vnp_PayDate.substring(4, 6) +
//                           "-" +
//                           router.query.vnp_PayDate.substring(6, 8) +
//                           " " +
//                           router.query.vnp_PayDate.substring(8, 10) +
//                           ":" +
//                           router.query.vnp_PayDate.substring(10, 12) +
//                           ":" +
//                           router.query.vnp_PayDate.substring(12, 14)
//                       ).toLocaleString("vi-VN")
//                     : "N/A"}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PaymentCallbackPage;
