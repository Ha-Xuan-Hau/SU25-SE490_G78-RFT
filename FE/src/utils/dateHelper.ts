import dayjs, { type Dayjs, VN_TZ } from "@/utils/dayjs";

export const parseArrayDate = (dateArray: number[]): Dayjs => {
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;

  // Tạo string format YYYY-MM-DD HH:mm:ss
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

  // Parse string này như VN time
  return dayjs.tz(dateString, VN_TZ);
};

// Convert Dayjs object sang array format để gửi lên API
export const toArrayDate = (date: Dayjs): number[] => {
  const vnDate = date.tz(VN_TZ);
  return [
    vnDate.year(),
    vnDate.month() + 1,
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
  return dayjs.utc(dateInput).tz(VN_TZ);
};

// Format để gửi lên API
export const formatDateToAPI = (
  date: string | Date | Dayjs
): number[] | string => {
  const dayjsDate = dayjs(date).tz(VN_TZ);
  return toArrayDate(dayjsDate);
};
