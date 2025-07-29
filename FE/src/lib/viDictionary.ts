// Bộ từ điển dịch tiếng Anh sang tiếng Việt cho các đặc điểm xe, tiện nghi, ...
export const viDictionary: Record<string, string> = {
  AUTOMATIC: "Hộp số tự động",
  MANUAL: "Hộp số sàn",
  GASOLINE: "Xăng",
  DIESEL: "Dầu diesel",
  ELECTRIC: "Điện",
  HYBRID: "Lai điện",
  GPS: "Định vị GPS",
  Bluetooth: "Bluetooth",
  "Air Conditioning": "Điều hòa",
  "Electric Charging": "Sạc điện",
  "5 Seats": "5 Ghế ngồi",
  "4 Seats": "4 Ghế ngồi",
  "7 Seats": "7 Ghế ngồi",
  CAR: "Xe ô tô",
  MOTORBIKE: "Xe máy",
  BICYCLE: "Xe đạp",
  Seat: "Ghế ngồi",
  Fuel: "Nhiên liệu",
  Transmission: "Hộp số",

  CANCELLED: "Đã hủy",
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang chờ",
  CONFIRMED: "Đã xác nhận",
  DELIVERED: "Đã giao",
  RECEIVED_BY_CUSTOMER: "Đã nhận bởi khách hàng",
  RETURNED: "Đã trả",
  COMPLETED: "Đã hoàn thành",
  VALID: "Còn hiệu lực",
  INVALID: "Không còn hiệu lực",
  FINISHED: "Đã hoàn thành",
};

export function translateENtoVI(text: string): string {
  return viDictionary[text] || text;
}
