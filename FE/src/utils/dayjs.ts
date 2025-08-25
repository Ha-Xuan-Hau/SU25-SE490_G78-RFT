// utils/dayjs.ts
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// QUAN TRỌNG: Force timezone cho cả server và client
const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

// Set default timezone
dayjs.tz.setDefault(VN_TIMEZONE);

// Override dayjs() để luôn trả về VN time
const customDayjs = (...args: any[]) => {
  if (args.length === 0) {
    // Khi gọi dayjs() không tham số -> lấy current time VN
    return dayjs.tz(undefined, VN_TIMEZONE);
  }
  // Với tham số, parse và convert sang VN
  const instance = dayjs(...args);
  return instance.tz(VN_TIMEZONE);
};

// Copy tất cả methods từ dayjs sang customDayjs
Object.setPrototypeOf(customDayjs, dayjs);
Object.keys(dayjs).forEach((key) => {
  (customDayjs as any)[key] = (dayjs as any)[key];
});

// Override tz method
customDayjs.tz = (date?: any, timezone?: string) => {
  return dayjs.tz(date, timezone || VN_TIMEZONE);
};

// Export custom dayjs
export default customDayjs as typeof dayjs;
export type { Dayjs };
export const VN_TZ = VN_TIMEZONE;
