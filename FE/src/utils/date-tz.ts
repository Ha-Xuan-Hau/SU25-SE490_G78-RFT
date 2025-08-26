// utils/date-tz.ts
import {
  format,
  parseISO,
  addHours,
  differenceInHours,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
  addDays,
} from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const VN_TZ = "Asia/Ho_Chi_Minh";

// Parse date từ backend (string hoặc array) -> Date object trong VN timezone
export const parseBackendTime = (timeData: string | number[]): Date => {
  if (Array.isArray(timeData)) {
    const [year, month, day, hour = 0, minute = 0] = timeData;
    // Tạo date string và parse như VN time
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(
      minute
    ).padStart(2, "0")}:00`;
    // Parse as VN time, convert to UTC
    return fromZonedTime(dateString, VN_TZ);
  }

  // String format - assume it's VN time without timezone
  return fromZonedTime(timeData, VN_TZ);
};

// Format Date object sang string cho backend (VN timezone)
export const formatTimeForBackend = (date: Date): string => {
  return formatInTimeZone(date, VN_TZ, "yyyy-MM-dd'T'HH:mm:ss");
};

// Convert Date sang array format
export const toArrayDate = (date: Date): number[] => {
  const vnDate = toZonedTime(date, VN_TZ);
  return [
    vnDate.getFullYear(),
    vnDate.getMonth() + 1,
    vnDate.getDate(),
    vnDate.getHours(),
    vnDate.getMinutes(),
  ];
};
