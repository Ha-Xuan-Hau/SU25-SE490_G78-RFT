import dayjs, { type Dayjs, VN_TZ } from "@/utils/dayjs";

export const parseArrayDate = (dateArray: number[]): Dayjs => {
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;

  // Tạo Date object với VN timezone context
  // month - 1 vì Date constructor cũng dùng 0-indexed month
  const date = new Date(year, month - 1, day, hour, minute, second);

  // Parse date này như VN time
  return dayjs.tz(date, VN_TZ);
};

// Convert Dayjs object sang array format để gửi lên API
export const toArrayDate = (date: Dayjs): number[] => {
  const vnDate = date.tz(VN_TZ);
  return [
    vnDate.year(),
    vnDate.month() + 1, // Chuyển từ 0-11 sang 1-12
    vnDate.date(),
    vnDate.hour(),
    vnDate.minute(),
  ];
};

// Parse input từ API
export const formatDateFromAPI = (dateInput: string | number[]): Dayjs => {
  if (Array.isArray(dateInput)) {
    return parseArrayDate(dateInput);
  }
  // Nếu là string UTC
  return dayjs.utc(dateInput).tz(VN_TZ);
};

// Format để gửi lên API
export const formatDateToAPI = (
  date: string | Date | Dayjs
): number[] | string => {
  const dayjsDate = dayjs(date).tz(VN_TZ);
  // Return array format
  return toArrayDate(dayjsDate);
};
