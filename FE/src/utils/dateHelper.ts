// utils/dateHelper.ts
import dayjs, { type Dayjs } from "@/utils/dayjs";

export const formatDateFromAPI = (dateString: string): Dayjs => {
  // Assume API trả về UTC, convert về VN timezone
  return dayjs(dateString).tz("Asia/Ho_Chi_Minh");
};

export const formatDateToAPI = (date: string | Date | Dayjs): string => {
  // Convert từ VN timezone về UTC để gửi lên API
  return dayjs(date).tz("Asia/Ho_Chi_Minh").utc().format();
};

export const getCurrentTimeVN = (): Dayjs => {
  return dayjs().tz("Asia/Ho_Chi_Minh");
};

// Thêm các helper functions khác nếu cần
export const formatDisplay = (
  date: string | Date | Dayjs,
  format: string = "DD/MM/YYYY HH:mm"
): string => {
  return dayjs(date).tz("Asia/Ho_Chi_Minh").format(format);
};

export const isToday = (date: string | Date | Dayjs): boolean => {
  return dayjs(date).tz("Asia/Ho_Chi_Minh").isSame(getCurrentTimeVN(), "day");
};
